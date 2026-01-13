using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ptdm.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductComposition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Composite",
                table: "product",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "product_composition",
                columns: table => new
                {
                    CompositeProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ComponentProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<double>(type: "double precision", nullable: false, defaultValue: 1.0),
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_composition", x => new { x.CompositeProductId, x.ComponentProductId });
                    table.ForeignKey(
                        name: "FK_product_composition_product_ComponentProductId",
                        column: x => x.ComponentProductId,
                        principalTable: "product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_product_composition_product_CompositeProductId",
                        column: x => x.CompositeProductId,
                        principalTable: "product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_product_composition_ComponentProductId",
                table: "product_composition",
                column: "ComponentProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_composition");

            migrationBuilder.DropColumn(
                name: "Composite",
                table: "product");
        }
    }
}
