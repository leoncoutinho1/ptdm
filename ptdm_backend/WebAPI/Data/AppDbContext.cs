using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WebAPI.Data.EntitiesConfiguration;
using WebAPI.Models;

namespace WebAPI.Data;
public class AppDbContext : IdentityDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {

    }

    public DbSet<Product> Products { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleProduct> SaleProducts { get; set; }
    public DbSet<PaymentForm> PaymentForms { get; set; }
    public DbSet<Cashier> Cashiers { get; set; }
    public DbSet<Checkout> Checkouts { get; set; }
    public DbSet<Barcode> Barcodes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        new BarcodeEntityTypeConfiguration().Configure(modelBuilder.Entity<Barcode>());
        new CashierEntityTypeConfiguration().Configure(modelBuilder.Entity<Cashier>());
        new CheckoutEntityTypeConfiguration().Configure(modelBuilder.Entity<Checkout>());
        new PaymentFormEntityTypeConfiguration().Configure(modelBuilder.Entity<PaymentForm>());
        new ProductEntityTypeConfiguration().Configure(modelBuilder.Entity<Product>());
        new SaleEntityTypeConfiguration().Configure(modelBuilder.Entity<Sale>());
        new SaleProductEntityTypeConfiguration().Configure(modelBuilder.Entity<SaleProduct>());
    }

}