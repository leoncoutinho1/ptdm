using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
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
    
}