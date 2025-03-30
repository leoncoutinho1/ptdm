using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ptdm.Domain.Models;

namespace ptdm.Data.Context.EntitiesConfiguration
{
    public class SaleEntityTypeConfiguration : IEntityTypeConfiguration<Sale>
    {
        public void Configure(EntityTypeBuilder<Sale> builder)
        {
            builder.ToTable("sale");
            builder.HasKey("Id");
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.CreatedAt).IsRequired();
            builder
                .HasOne(s => s.Checkout).WithMany(ch => ch.Sales).HasForeignKey(s => s.CheckoutId).IsRequired();
            builder
                .HasOne(s => s.Cashier).WithMany(ca => ca.Sales).HasForeignKey(s => s.CashierId).IsRequired();
            builder
                .HasOne(s => s.PaymentForm).WithMany(p => p.Sales).HasForeignKey(s => s.PaymentFormId).IsRequired();
            builder
                .HasMany(s => s.SaleProducts).WithOne(sp => sp.Sale).HasForeignKey(s => s.SaleId).IsRequired();
            builder.Property(p => p.TotalValue).IsRequired().HasDefaultValue(0);
            builder.Property(p => p.PaidValue).IsRequired().HasDefaultValue(0);
            builder.Property(p => p.ChangeValue).IsRequired().HasDefaultValue(0);
            builder.Property(p => p.OverallDiscount).IsRequired().HasDefaultValue(0);
        }
    }
}
