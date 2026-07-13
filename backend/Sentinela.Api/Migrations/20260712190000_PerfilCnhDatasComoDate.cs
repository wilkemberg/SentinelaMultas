using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Corrige o tipo das colunas DataNascimento/DataExpedicaoCnh de
    /// "timestamp with time zone" para "date". A CNH usa apenas datas de
    /// calendário (sem hora/fuso), e o driver Npgsql 6+ lança exceção ao
    /// gravar um DateTime com Kind=Unspecified (como vem do JSON do front)
    /// em coluna timestamptz.
    /// </summary>
    public partial class PerfilCnhDatasComoDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "DataNascimento",
                table: "Usuarios",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DataExpedicaoCnh",
                table: "Usuarios",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "DataNascimento",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DataExpedicaoCnh",
                table: "Usuarios",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: true);
        }
    }
}
