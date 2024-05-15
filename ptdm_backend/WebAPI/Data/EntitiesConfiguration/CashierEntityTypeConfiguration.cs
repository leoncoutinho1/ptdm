using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Data.EntitiesConfiguration
{
    public class CashierEntityTypeConfiguration : IEntityTypeConfiguration<Cashier>
    {
        public void Configure(EntityTypeBuilder<Cashier> builder)
        {
            builder.ToTable("cashier");
            builder.HasKey("Id");
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.CreatedAt).IsRequired();
            builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        }
    }
}
