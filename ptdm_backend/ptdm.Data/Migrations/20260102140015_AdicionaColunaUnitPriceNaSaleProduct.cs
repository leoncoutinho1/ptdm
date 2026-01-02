using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ptdm.Data.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaColunaUnitPriceNaSaleProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "UnitPrice",
                table: "sale_product",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnitPrice",
                table: "sale_product");
        }
    }
}
