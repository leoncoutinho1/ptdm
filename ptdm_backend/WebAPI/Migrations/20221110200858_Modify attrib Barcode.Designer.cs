// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using WebAPI.Data;

#nullable disable

namespace WebAPI.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20221110200858_Modify attrib Barcode")]
    partial class ModifyattribBarcode
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "6.0.8")
                .HasAnnotation("Relational:MaxIdentifierLength", 64);

            modelBuilder.Entity("WebAPI.Models.Barcode", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<string>("Code")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<Guid?>("ProductId")
                        .HasColumnType("char(36)");

                    b.HasKey("Id");

                    b.HasIndex("ProductId");

                    b.ToTable("Barcode");
                });

            modelBuilder.Entity("WebAPI.Models.Cashier", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("Id");

                    b.ToTable("cashier");
                });

            modelBuilder.Entity("WebAPI.Models.Checkout", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("Id");

                    b.ToTable("checkout");
                });

            modelBuilder.Entity("WebAPI.Models.PaymentForm", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("varchar(100)");

                    b.HasKey("Id");

                    b.ToTable("payment_form");
                });

            modelBuilder.Entity("WebAPI.Models.Product", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<double>("Cost")
                        .HasColumnType("double");

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime(6)");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("varchar(100)");

                    b.Property<double>("Price")
                        .HasColumnType("double");

                    b.Property<double>("Quantity")
                        .HasColumnType("double");

                    b.HasKey("Id");

                    b.ToTable("product");
                });

            modelBuilder.Entity("WebAPI.Models.Sale", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<Guid>("CashierId")
                        .HasColumnType("char(36)");

                    b.Property<Guid>("CheckoutId")
                        .HasColumnType("char(36)");

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime(6)");

                    b.Property<double>("OverallDiscount")
                        .HasColumnType("double");

                    b.Property<Guid>("PaymentFormId")
                        .HasColumnType("char(36)");

                    b.Property<double>("TotalValue")
                        .HasColumnType("double");

                    b.HasKey("Id");

                    b.HasIndex("CashierId");

                    b.HasIndex("CheckoutId");

                    b.HasIndex("PaymentFormId");

                    b.ToTable("sale");
                });

            modelBuilder.Entity("WebAPI.Models.SaleProduct", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("char(36)");

                    b.Property<double>("Discount")
                        .HasColumnType("double");

                    b.Property<Guid>("ProductId")
                        .HasColumnType("char(36)");

                    b.Property<double>("Quantity")
                        .HasColumnType("double");

                    b.Property<Guid?>("SaleId")
                        .HasColumnType("char(36)");

                    b.HasKey("Id");

                    b.HasIndex("ProductId");

                    b.HasIndex("SaleId");

                    b.ToTable("sale_product");
                });

            modelBuilder.Entity("WebAPI.Models.Barcode", b =>
                {
                    b.HasOne("WebAPI.Models.Product", null)
                        .WithMany("Barcode")
                        .HasForeignKey("ProductId");
                });

            modelBuilder.Entity("WebAPI.Models.Sale", b =>
                {
                    b.HasOne("WebAPI.Models.Cashier", "Cashier")
                        .WithMany()
                        .HasForeignKey("CashierId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("WebAPI.Models.Checkout", "Checkout")
                        .WithMany()
                        .HasForeignKey("CheckoutId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("WebAPI.Models.PaymentForm", "PaymentForm")
                        .WithMany()
                        .HasForeignKey("PaymentFormId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Cashier");

                    b.Navigation("Checkout");

                    b.Navigation("PaymentForm");
                });

            modelBuilder.Entity("WebAPI.Models.SaleProduct", b =>
                {
                    b.HasOne("WebAPI.Models.Product", "Product")
                        .WithMany()
                        .HasForeignKey("ProductId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("WebAPI.Models.Sale", null)
                        .WithMany("SaleProducts")
                        .HasForeignKey("SaleId");

                    b.Navigation("Product");
                });

            modelBuilder.Entity("WebAPI.Models.Product", b =>
                {
                    b.Navigation("Barcode");
                });

            modelBuilder.Entity("WebAPI.Models.Sale", b =>
                {
                    b.Navigation("SaleProducts");
                });
#pragma warning restore 612, 618
        }
    }
}
