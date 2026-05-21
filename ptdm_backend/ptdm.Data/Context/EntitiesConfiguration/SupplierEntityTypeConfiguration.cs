using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using ptdm.Domain.Models;

namespace ptdm.Data.Context.EntitiesConfiguration
{
    public class SupplierEntityTypeConfiguration : IEntityTypeConfiguration<Supplier>
    {
        public void Configure(EntityTypeBuilder<Supplier> builder)
        {
            builder.ToTable("supplier");
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Id).IsRequired();
            builder.Property(s => s.CreatedAt).IsRequired();
            builder.Property(s => s.Description).IsRequired().HasMaxLength(150);
        }
    }
}
