using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    public partial class ModifyclassBarcode : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Barcode_product_ProductId",
                table: "Barcode");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Barcode",
                table: "Barcode");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Barcode");

            migrationBuilder.RenameTable(
                name: "Barcode",
                newName: "barcode");

            migrationBuilder.RenameIndex(
                name: "IX_Barcode_ProductId",
                table: "barcode",
                newName: "IX_barcode_ProductId");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "barcode",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_barcode",
                table: "barcode",
                column: "Code");

            migrationBuilder.AddForeignKey(
                name: "FK_barcode_product_ProductId",
                table: "barcode",
                column: "ProductId",
                principalTable: "product",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_barcode_product_ProductId",
                table: "barcode");

            migrationBuilder.DropPrimaryKey(
                name: "PK_barcode",
                table: "barcode");

            migrationBuilder.RenameTable(
                name: "barcode",
                newName: "Barcode");

            migrationBuilder.RenameIndex(
                name: "IX_barcode_ProductId",
                table: "Barcode",
                newName: "IX_Barcode_ProductId");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Barcode",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "Barcode",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Barcode",
                table: "Barcode",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Barcode_product_ProductId",
                table: "Barcode",
                column: "ProductId",
                principalTable: "product",
                principalColumn: "Id");
        }
    }
}
