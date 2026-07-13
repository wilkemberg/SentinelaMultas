using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Sentinela.Api.BackgroundJobs;
using Sentinela.Api.Data;
using Sentinela.Api.Services;

var builder = WebApplication.CreateBuilder(args);

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

// --- Serviços de domínio ---
// Timeout maior que o padrão (100s): a consulta ao SERPRO/RADAR é uma raspagem
// em tempo real de um site do governo (não uma API instantânea) e a própria
// Infosimples recebe um parâmetro "timeout=300" pedindo até 5 minutos. Sem
// isso, o HttpClient cancelava a chamada antes da Infosimples terminar,
// fazendo a consulta "sumir" sem erro nem resultado.
builder.Services.AddHttpClient<IConsultaMultasService, SerproRadarConsultaService>(c => c.Timeout = TimeSpan.FromSeconds(320));
builder.Services.AddHttpClient<ICtbAnaliseService, AnthropicCtbAnaliseService>();
builder.Services.AddHttpClient<INotificacaoService, NotificacaoService>();
// Mesmo motivo do SERPRO/RADAR acima: a validação de CNH também é uma
// automação sobre um portal governamental lento (SENATRAN via Infosimples),
// não uma API instantânea.
builder.Services.AddHttpClient<ICnhValidacaoService, SenatranValidarCnhService>(c => c.Timeout = TimeSpan.FromSeconds(320));
builder.Services.AddSingleton<ICtbBaseConhecimentoService, RichCtbBaseConhecimentoService>();
builder.Services.AddSingleton<IJwtService, JwtService>();

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
