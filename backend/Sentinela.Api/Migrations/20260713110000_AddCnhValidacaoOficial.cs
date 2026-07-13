using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Adiciona os campos necessários para validar a CNH oficialmente junto ao
    /// SENATRAN (via Infosimples): NomeMae (exigido pela consulta), e os
    /// resultados oficiais SituacaoCnh/ValidadeCnhOficial/CnhValidadaEm, que têm
    /// prioridade sobre os dados autodeclarados quando presentes.
    /// </summary>
    public partial class AddCnhValidacaoOficial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NomeMae",
                table: "Usuarios",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SituacaoCnh",
                table: "Usuarios",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidadeCnhOficial",
                table: "Usuarios",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CnhValidadaEm",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NomeMae",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "SituacaoCnh",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "ValidadeCnhOficial",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CnhValidadaEm",
                table: "Usuarios");
        }
    }
}
