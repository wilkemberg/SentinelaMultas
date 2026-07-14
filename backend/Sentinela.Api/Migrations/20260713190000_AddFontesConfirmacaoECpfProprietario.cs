using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Adiciona:
    /// - Multas.FontesConfirmacao: quais fontes de consulta (SERPRO/RADAR,
    ///   DETRAN-RJ) confirmaram cada multa, usado para o selo "confirmada em
    ///   2 fontes" na UI.
    /// - Veiculos.CpfProprietario: CPF opcional específico do veículo, usado na
    ///   consulta ao DETRAN-RJ/Nada-Consta quando o veículo não está no CPF do
    ///   dono da conta (financiado, de terceiro, de empresa).
    /// </summary>
    public partial class AddFontesConfirmacaoECpfProprietario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FontesConfirmacao",
                table: "Multas",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CpfProprietario",
                table: "Veiculos",
                type: "character varying(11)",
                maxLength: 11,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FontesConfirmacao",
                table: "Multas");

            migrationBuilder.DropColumn(
                name: "CpfProprietario",
                table: "Veiculos");
        }
    }
}
