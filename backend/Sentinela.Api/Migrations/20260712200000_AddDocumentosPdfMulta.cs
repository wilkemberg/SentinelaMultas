using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Adiciona colunas para guardar os links dos documentos originais (PDF de
    /// autuação e boleto) retornados pela consulta ao SERPRO/RADAR/Veículo.
    /// </summary>
    public partial class AddDocumentosPdfMulta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AutuacaoPdfUrl",
                table: "Multas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BoletoPdfUrl",
                table: "Multas",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutuacaoPdfUrl",
                table: "Multas");

            migrationBuilder.DropColumn(
                name: "BoletoPdfUrl",
                table: "Multas");
        }
    }
}
