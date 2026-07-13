using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAtividadeRemunerada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AtividadeRemunerada",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AtividadeRemunerada",
                table: "Usuarios");
        }
    }
}
