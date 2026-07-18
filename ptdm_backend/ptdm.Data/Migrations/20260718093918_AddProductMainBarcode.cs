using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ptdm.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductMainBarcode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MainBarcode",
                table: "product",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MainBarcode",
                table: "product");
        }
    }
}
