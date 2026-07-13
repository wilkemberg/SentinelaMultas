using System.Text;
using System.Text.Json;
using Sentinela.Api.Models;

namespace Sentinela.Api.Services;

public interface INotificacaoService
{
    Task NotificarSemMultasAsync(Usuario usuario, Veiculo veiculo, CancellationToken ct = default);
    Task NotificarMultaEncontradaAsync(Usuario usuario, Veiculo veiculo, Multa multa, AnaliseCtb analise, CancellationToken ct = default);
}

/// <summary>
/// Envia por e-mail (Resend) e, se o usuário tiver optado, por WhatsApp
/// (Z-API no MVP; trocar para Meta Cloud API oficial quando validar tração).
/// </summary>
public class NotificacaoService : INotificacaoService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<NotificacaoService> _logger;

    public NotificacaoService(HttpClient http, IConfiguration config, ILogger<NotificacaoService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task NotificarSemMultasAsync(Usuario usuario, Veiculo veiculo, CancellationToken ct = default)
    {
        var assunto = $"Sentinela: tudo certo com a placa {veiculo.Placa} hoje";
        var corpo = $"Olá {usuario.Nome}, verificamos hoje e não há nenhuma multa nova para a placa {veiculo.Placa}.";

        if (usuario.NotificarEmail)
            await EnviarEmailAsync(usuario.Email, assunto, corpo, ct);

        if (usuario.NotificarWhatsApp && !string.IsNullOrWhiteSpace(usuario.WhatsAppNumero))
            await EnviarWhatsAppAsync(usuario.WhatsAppNumero!, corpo, ct);
    }

    public async Task NotificarMultaEncontradaAsync(Usuario usuario, Veiculo veiculo, Multa multa, AnaliseCtb analise, CancellationToken ct = default)
    {
        var assunto = $"Sentinela: nova multa encontrada na placa {veiculo.Placa}";
        var corpo = new StringBuilder()
            .AppendLine($"Olá {usuario.Nome}, encontramos uma multa nova na placa {veiculo.Placa}.")
            .AppendLine()
            .AppendLine($"Infração: {multa.DescricaoInfracao} ({analise.ArtigoCtb})")
            .AppendLine($"Por que aconteceu: {analise.ExplicacaoSimples}")
            .AppendLine(analise.RecursoRecomendado
                ? "Recomendação: vale a pena recorrer. Já preparamos a fundamentação no seu painel."
                : "Recomendação: neste caso o recurso tem baixa chance de êxito.")
            .AppendLine($"Prazo estimado: {multa.PrazoDefesaPrevia:dd/MM/yyyy}")
            .AppendLine($"Como evitar de novo: {analise.ComoEvitarNoFuturo}")
            .ToString();

        if (usuario.NotificarEmail)
            await EnviarEmailAsync(usuario.Email, assunto, corpo, ct);

        if (usuario.NotificarWhatsApp && !string.IsNullOrWhiteSpace(usuario.WhatsAppNumero))
            await EnviarWhatsAppAsync(usuario.WhatsAppNumero!, corpo, ct);
    }

    private async Task EnviarEmailAsync(string destinatario, string assunto, string corpo, CancellationToken ct)
    {
        var apiKey = _config["Resend:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Resend:ApiKey não configurado. E-mail não enviado (modo dev): {Assunto}", assunto);
            return;
        }

        var payload = new
        {
            from = _config["Resend:RemetentePadrao"] ?? "Sentinela <alertas@sentinela.app>",
            to = new[] { destinatario },
            subject = assunto,
            text = corpo
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            _logger.LogError("Falha ao enviar e-mail: {Status}", response.StatusCode);
    }

    private async Task EnviarWhatsAppAsync(string numero, string mensagem, CancellationToken ct)
    {
        var instanceId = _config["ZApi:InstanceId"];
        var token = _config["ZApi:Token"];
        if (string.IsNullOrWhiteSpace(instanceId) || string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Z-API não configurado. WhatsApp não enviado (modo dev) para {Numero}", numero);
            return;
        }

        var url = $"https://api.z-api.io/instances/{instanceId}/token/{token}/send-text";
        var payload = new { phone = numero, message = mensagem };

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            _logger.LogError("Falha ao enviar WhatsApp: {Status}", response.StatusCode);
    }
}
