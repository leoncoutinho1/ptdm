using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using ptdm.Domain.Models;

namespace ptdm.Data.Context.EntitiesConfiguration
{
    public class ProductEntityTypeConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.ToTable("product");
            builder.HasKey("Id");
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.CreatedAt).IsRequired();
            builder.Property(p => p.Description).IsRequired().HasMaxLength(100);
            builder.Property(p => p.Cost).IsRequired();
            builder.Property(p => p.ProfitMargin).IsRequired();
            builder.Property(p => p.Price).IsRequired();
            builder.Property(p => p.Quantity).IsRequired();
            builder.Property(p => p.Unit).IsRequired().HasMaxLength(2);
            builder.Property(p => p.Composite).IsRequired();
            builder.Property(p => p.ValidityDays).IsRequired().HasDefaultValue(0);
            builder.Property(p => p.IntegrateScale).IsRequired().HasDefaultValue(false);
        }
    }
}
