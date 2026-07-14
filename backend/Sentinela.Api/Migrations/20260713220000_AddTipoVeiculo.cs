using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinela.Api.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Adiciona Veiculos.Tipo (enum TipoVeiculo: Carro=0, Moto=1), usado no
    /// seletor "Carro/Moto" do cadastro de veículo. Default 0 (Carro) para
    /// não quebrar veículos já cadastrados antes desse campo existir.
    /// </summary>
    public partial class AddTipoVeiculo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "Veiculos",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Veiculos");
        }
    }
}
