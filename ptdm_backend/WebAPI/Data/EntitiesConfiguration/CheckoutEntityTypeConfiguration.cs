using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebAPI.Models;

namespace WebAPI.Data.EntitiesConfiguration
{
    public class CheckoutEntityTypeConfiguration : IEntityTypeConfiguration<Checkout>
    {
        public void Configure(EntityTypeBuilder<Checkout> builder)
        {
            builder.ToTable("checkout");
            builder.HasKey("Id");
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.CreatedAt).IsRequired();
            builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        }
    }
}
