using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ptdm.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "sale",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "sale",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "sale",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "product",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "product",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "product",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "payment_form",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "payment_form",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "payment_form",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "checkout",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "checkout",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "checkout",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "category",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "category",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "category",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "cashier",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "cashier",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "cashier",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "sale");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "product");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "product");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "product");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "payment_form");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "payment_form");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "payment_form");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "checkout");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "checkout");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "checkout");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "category");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "category");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "category");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "cashier");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "cashier");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "cashier");
        }
    }
}
