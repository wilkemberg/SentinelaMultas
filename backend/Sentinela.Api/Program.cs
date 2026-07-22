using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sentinela.Api.BackgroundJobs;
using Sentinela.Api.Data;
using Sentinela.Api.Services;
using Serilog;

// Licença Community do QuestPDF (gerador de PDF das multas anexadas por
// e-mail) — gratuita para indivíduos/empresas com faturamento anual abaixo de
// US$1M. Precisa ser definida uma vez, antes de qualquer geração de PDF.
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// --- Logging estruturado (Serilog) ---
// Console (legível em dev, JSON-friendly em produção via docker logs) +
// arquivo rolante diário em /app/logs, retendo 14 dias — sem isso, a única
// forma de investigar uma falha do job diário era torcer para o log do
// container ainda existir.
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        Path.Combine(AppContext.BaseDirectory, "logs", "sentinela-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14));

// --- Banco de dados ---
builder.Services.AddDbContext<SentinelaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// --- JWT Auth ---
var jwtSection = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSection["SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey não configurada.");
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// --- Rate limiting nos endpoints de autenticação ---
// Mitiga força bruta em login/registro/esqueci-senha: no máximo 10 tentativas
// por IP a cada janela de 1 minuto, sem fila (quem estourar o limite recebe
// 429 imediatamente em vez de esperar). Aplicado via [EnableRateLimiting("auth")]
// no AuthController — os demais endpoints da API não são afetados.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
});

// --- Serviços de domínio ---
// Timeout maior que o padrão (100s): a consulta ao SERPRO/RADAR é uma raspagem
// em tempo real de um site do governo (não uma API instantânea) e a própria
// Infosimples recebe um parâmetro "timeout=300" pedindo até 5 minutos. Sem
// isso, o HttpClient cancelava a chamada antes da Infosimples terminar,
// fazendo a consulta "sumir" sem erro nem resultado.
builder.Services.AddHttpClient<IConsultaMultasService, SerproRadarConsultaService>(c => c.Timeout = TimeSpan.FromSeconds(320));
// Fonte única de consulta hoje: SERPRO/RADAR (base nacional RENAINF). A
// segunda fonte (DETRAN-RJ/Nada-Consta) foi desativada a pedido — o serviço
// (DetranRjNadaConstaService.cs) continua no código, só não está registrado
// no DI, caso seja necessário reativar no futuro.
builder.Services.AddHttpClient<ICtbAnaliseService, AnthropicCtbAnaliseService>();
builder.Services.AddHttpClient<INotificacaoService, NotificacaoService>();
// Mesmo motivo do SERPRO/RADAR acima: a validação de CNH também é uma
// automação sobre um portal governamental lento (SENATRAN via Infosimples),
// não uma API instantânea.
builder.Services.AddHttpClient<ICnhValidacaoService, SenatranValidarCnhService>(c => c.Timeout = TimeSpan.FromSeconds(320));
builder.Services.AddSingleton<ICtbBaseConhecimentoService, RichCtbBaseConhecimentoService>();
builder.Services.AddSingleton<IJwtService, JwtService>();
// Gera o PDF de detalhe anexado ao e-mail de "multa nova encontrada" — sem
// estado, então Singleton é seguro.
builder.Services.AddSingleton<IMultaPdfService, MultaPdfService>();

// --- Job diário de monitoramento ---
builder.Services.AddHostedService<MonitoramentoDiarioJob>();

// --- CORS para o front (Next.js) ---
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(
                builder.Configuration["Frontend:Origem"] ?? "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// Serializa enums (Gravidade, StatusRecurso, etc.) como texto ("Leve", "RecursoViavel", ...)
// em vez do valor numérico padrão do System.Text.Json — o frontend espera essas
// strings (ver tipos "Leve"|"Media"|... e StatusRecurso em lib/api.ts). Sem isso,
// os badges de gravidade/status na UI caem no fallback (ex.: mostrando "1" em vez
// de "Média", ou sempre "Não avaliado" independente do status real).
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Sentinela API",
        Version = "v1",
        Description = "Monitoramento diário de multas, análise via CTB e geração de defesa."
    });

    // Suporte a JWT no Swagger UI
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Informe o token JWT. Ex: Bearer {seu_token}"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Aplica as migrations automaticamente ao iniciar (útil para o docker-compose)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SentinelaDbContext>();
    dbContext.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Sentinela API v1");
    options.RoutePrefix = "swagger";
});

app.UseCors();
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
