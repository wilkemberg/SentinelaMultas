using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Adiciona os campos de segurança/conformidade de conta que faltavam para
    /// operar como SaaS: verificação de e-mail no cadastro (EmailVerificado +
    /// token), recuperação de senha ("esqueci minha senha", token próprio),
    /// registro de consentimento LGPD no cadastro (ConsentimentoLgpdEm) e
    /// exclusão de conta (soft delete — ContaExcluida/ContaExcluidaEm, para
    /// preservar o histórico de multas/veículos já gerado).
    /// </summary>
    public partial class AddContaSegurancaLgpd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailVerificado",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TokenVerificacaoEmail",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenVerificacaoEmailExpiraEm",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TokenResetSenha",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenResetSenhaExpiraEm",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ConsentimentoLgpdEm",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ContaExcluida",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ContaExcluidaEm",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "EmailVerificado", table: "Usuarios");
            migrationBuilder.DropColumn(name: "TokenVerificacaoEmail", table: "Usuarios");
            migrationBuilder.DropColumn(name: "TokenVerificacaoEmailExpiraEm", table: "Usuarios");
            migrationBuilder.DropColumn(name: "TokenResetSenha", table: "Usuarios");
            migrationBuilder.DropColumn(name: "TokenResetSenhaExpiraEm", table: "Usuarios");
            migrationBuilder.DropColumn(name: "ConsentimentoLgpdEm", table: "Usuarios");
            migrationBuilder.DropColumn(name: "ContaExcluida", table: "Usuarios");
            migrationBuilder.DropColumn(name: "ContaExcluidaEm", table: "Usuarios");
        }
    }
}
