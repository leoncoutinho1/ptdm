using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    public partial class AddAttribsPaidValueAndChangeValue : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_barcode_product_ProductId",
                table: "barcode");

            migrationBuilder.AddColumn<double>(
                name: "ChangeValue",
                table: "sale",
                type: "double",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "PaidValue",
                table: "sale",
                type: "double",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "barcode",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddForeignKey(
                name: "FK_barcode_product_ProductId",
                table: "barcode",
                column: "ProductId",
                principalTable: "product",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_barcode_product_ProductId",
                table: "barcode");

            migrationBuilder.DropColumn(
                name: "ChangeValue",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "PaidValue",
                table: "sale");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "barcode",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddForeignKey(
                name: "FK_barcode_product_ProductId",
                table: "barcode",
                column: "ProductId",
                principalTable: "product",
                principalColumn: "Id");
        }
    }
}
