using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ptdm.Domain.Models;

namespace ptdm.Data.Context.EntitiesConfiguration
{
    public class SaleProductEntityTypeConfiguration : IEntityTypeConfiguration<SaleProduct>
    {
        public void Configure(EntityTypeBuilder<SaleProduct> builder)
        {
            builder.ToTable("sale_product");
            builder.HasKey("SaleId","ProductId");
            builder
                .HasOne(sp => sp.Sale).WithMany(s => s.SaleProducts).HasForeignKey(sp => sp.SaleId).IsRequired();
            builder
                .HasOne(sp => sp.Product).WithMany(p => p.SaleProducts).HasForeignKey(sp => sp.ProductId).IsRequired();
            builder.Property(sp => sp.Discount).IsRequired().HasDefaultValue(0);
            builder.Property(sp => sp.UnitPrice).IsRequired();
            builder.Property(sp => sp.Quantity).IsRequired();
        }
    }
}
