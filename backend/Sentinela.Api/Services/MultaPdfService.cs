using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Sentinela.Api.Models;

namespace Sentinela.Api.Services;

public interface IMultaPdfService
{
    /// <summary>Gera o PDF de detalhe de uma única multa (um arquivo por multa).</summary>
    byte[] Gerar(Multa multa, Veiculo veiculo);
}

/// <summary>
/// Gera um PDF com o detalhe completo de uma multa — os mesmos campos que
/// aparecem no card expandido da aplicação (ver MultaCard.tsx): dados do auto
/// de infração, análise do Sentinela AI, chance de recurso, prazo, fontes que
/// confirmaram a multa, e o texto de defesa (quando já gerado). Anexado por
/// e-mail em NotificacaoService.NotificarMultaEncontradaAsync — uma multa nova
/// por vez, um PDF por vez (nunca um PDF combinando várias multas).
///
/// Usa QuestPDF (licença Community — gratuita para indivíduos/empresas com
/// faturamento anual abaixo de US$1M; ver questpdf.com/license/community.html).
/// </summary>
public class MultaPdfService : IMultaPdfService
{
    private static readonly CultureInfo PtBr = new("pt-BR");

    public byte[] Gerar(Multa multa, Veiculo veiculo)
    {
        var documento = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                // "DejaVu Sans" (pacote fonts-dejavu-core, instalado no Dockerfile
                // da imagem final) — a imagem base do ASP.NET não vem com nenhuma
                // fonte, e o SkiaSharp (usado pelo QuestPDF) precisa de uma
                // instalada no sistema para renderizar texto, incluindo acentos.
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("DejaVu Sans"));

                page.Header().Column(col =>
                {
                    col.Item().Text("Sentinela — Detalhe da multa").FontSize(18).Bold().FontColor(Colors.Green.Darken2);
                    col.Item().PaddingTop(2).Text($"Placa {veiculo.Placa} · RENAVAM {veiculo.Renavam} · UF {veiculo.Uf}")
                        .FontSize(10).FontColor(Colors.Grey.Darken1);
                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Row(row =>
                    {
                        Campo(row.RelativeItem(), "Número do auto", multa.NumeroAutoInfracao);
                        Campo(row.RelativeItem(), "Órgão autuador", multa.OrgaoAutuador);
                    });

                    col.Item().Row(row =>
                    {
                        Campo(row.RelativeItem(), "Enquadramento CTB", string.IsNullOrWhiteSpace(multa.ArtigoCtb) ? (multa.CodigoInfracaoCtb.Length > 0 ? multa.CodigoInfracaoCtb : "—") : multa.ArtigoCtb);
                        Campo(row.RelativeItem(), "Gravidade", TraduzirGravidade(multa.Gravidade));
                    });

                    col.Item().Row(row =>
                    {
                        Campo(row.RelativeItem(), "Data da infração", multa.DataInfracao.ToString("dd/MM/yyyy HH:mm", PtBr));
                        Campo(row.RelativeItem(), "Detectada pelo Sentinela em", multa.DetectadaEm.ToString("dd/MM/yyyy HH:mm", PtBr));
                    });

                    col.Item().Row(row =>
                    {
                        Campo(row.RelativeItem(), "Local", string.IsNullOrWhiteSpace(multa.LocalInfracao) ? "—" : multa.LocalInfracao);
                        Campo(row.RelativeItem(), "Município", string.IsNullOrWhiteSpace(multa.Municipio) ? "—" : multa.Municipio);
                    });

                    col.Item().Row(row =>
                    {
                        Campo(row.RelativeItem(), "Valor", multa.Valor.ToString("C", PtBr));
                        Campo(row.RelativeItem(), "Pontos na CNH", multa.Pontos.ToString(PtBr));
                    });

                    if (!string.IsNullOrWhiteSpace(multa.FontesConfirmacao))
                    {
                        col.Item().Text($"✓ Confirmada em: {multa.FontesConfirmacao.Replace(",", ", ")}")
                            .FontSize(9).FontColor(Colors.Green.Darken2).Bold();
                    }

                    if (multa.PrazoDefesaPrevia is not null)
                    {
                        col.Item().PaddingTop(4).Background(Colors.Grey.Lighten4).Padding(8).Text(text =>
                        {
                            text.Span("Prazo limite (defesa prévia): ").SemiBold();
                            text.Span(multa.PrazoDefesaPrevia.Value.ToString("dd/MM/yyyy", PtBr)).Bold().FontColor(Colors.Red.Darken2);
                        });
                    }

                    Secao(col, "Descrição da infração", multa.DescricaoInfracao);
                    Secao(col, "Análise do Sentinela AI", multa.AnaliseIa);

                    if (multa.ChanceRecursoPercent is not null)
                    {
                        col.Item().PaddingTop(4).Text(text =>
                        {
                            text.Span("Probabilidade de sucesso no recurso: ").SemiBold();
                            text.Span($"{multa.ChanceRecursoPercent.Value:0}%").Bold();
                        });
                    }

                    Secao(col, "Fundamentação para recurso", multa.FundamentacaoRecurso);
                    Secao(col, "Onde recorrer", multa.OndeRecorrer);
                    Secao(col, "Onde obter desconto", multa.OndeObterDesconto);
                    Secao(col, "Como evitar no futuro", multa.ComoEvitarNoFuturo);
                    Secao(col, "Texto de defesa gerado", multa.TextoDefesa);
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Gerado automaticamente pelo Sentinela em ").FontSize(8).FontColor(Colors.Grey.Darken1);
                    text.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm", PtBr)).FontSize(8).FontColor(Colors.Grey.Darken1);
                });
            });
        });

        return documento.GeneratePdf();
    }

    private static void Campo(IContainer container, string rotulo, string valor)
    {
        container.Column(c =>
        {
            c.Item().Text(rotulo).FontSize(8).FontColor(Colors.Grey.Darken1);
            c.Item().Text(string.IsNullOrWhiteSpace(valor) ? "—" : valor);
        });
    }

    private static void Secao(ColumnDescriptor col, string titulo, string? conteudo)
    {
        if (string.IsNullOrWhiteSpace(conteudo)) return;

        col.Item().PaddingTop(6).Column(c =>
        {
            c.Item().Text(titulo).Bold().FontColor(Colors.Grey.Darken3);
            c.Item().PaddingTop(2).Text(conteudo).LineHeight(1.3f);
        });
    }

    private static string TraduzirGravidade(GravidadeInfracao gravidade) => gravidade switch
    {
        GravidadeInfracao.Leve => "Leve",
        GravidadeInfracao.Media => "Média",
        GravidadeInfracao.Grave => "Grave",
        GravidadeInfracao.Gravissima => "Gravíssima",
        _ => gravidade.ToString()
    };
}
