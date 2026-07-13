using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    WhatsAppNumero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SenhaHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    NotificarEmail = table.Column<bool>(type: "boolean", nullable: false),
                    NotificarWhatsApp = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UltimoLoginEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Veiculos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Placa = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Renavam = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Uf = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    MonitoramentoAtivo = table.Column<bool>(type: "boolean", nullable: false),
                    UltimaVerificacaoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veiculos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Veiculos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Multas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VeiculoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumeroAutoInfracao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OrgaoAutuador = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CodigoInfracaoCtb = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ArtigoCtb = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DescricaoInfracao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Gravidade = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Pontos = table.Column<int>(type: "integer", nullable: false),
                    DataInfracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PrazoDefesaPrevia = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PrazoRecursoJari = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PrazoRecursoCetran = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AnaliseIa = table.Column<string>(type: "text", nullable: true),
                    FundamentacaoRecurso = table.Column<string>(type: "text", nullable: true),
                    TextoDefesa = table.Column<string>(type: "text", nullable: true),
                    ComoEvitarNoFuturo = table.Column<string>(type: "text", nullable: true),
                    ChanceRecursoPercent = table.Column<double>(type: "double precision", nullable: true),
                    OndeRecorrer = table.Column<string>(type: "text", nullable: true),
                    OndeObterDesconto = table.Column<string>(type: "text", nullable: true),
                    LocalInfracao = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Municipio = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DetectadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AnalisadaEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Multas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Multas_Veiculos_VeiculoId",
                        column: x => x.VeiculoId,
                        principalTable: "Veiculos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Multas_VeiculoId_NumeroAutoInfracao",
                table: "Multas",
                columns: new[] { "VeiculoId", "NumeroAutoInfracao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Veiculos_Placa_Renavam",
                table: "Veiculos",
                columns: new[] { "Placa", "Renavam" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Veiculos_UsuarioId",
                table: "Veiculos",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Multas");

            migrationBuilder.DropTable(
                name: "Veiculos");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
