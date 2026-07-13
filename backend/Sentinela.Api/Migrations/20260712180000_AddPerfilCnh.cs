using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPerfilCnh : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cpf",
                table: "Usuarios",
                type: "character varying(11)",
                maxLength: 11,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroRegistroCnh",
                table: "Usuarios",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CategoriaCnh",
                table: "Usuarios",
                type: "character varying(5)",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataNascimento",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataExpedicaoCnh",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Cpf", table: "Usuarios");
            migrationBuilder.DropColumn(name: "NumeroRegistroCnh", table: "Usuarios");
            migrationBuilder.DropColumn(name: "CategoriaCnh", table: "Usuarios");
            migrationBuilder.DropColumn(name: "DataNascimento", table: "Usuarios");
            migrationBuilder.DropColumn(name: "DataExpedicaoCnh", table: "Usuarios");
        }
    }
}
