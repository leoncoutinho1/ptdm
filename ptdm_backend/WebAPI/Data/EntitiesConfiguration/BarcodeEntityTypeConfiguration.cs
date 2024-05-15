using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Data.EntitiesConfiguration
{
    public class BarcodeEntityTypeConfiguration : IEntityTypeConfiguration<Barcode>
    {
        public void Configure(EntityTypeBuilder<Barcode> builder)
        {
            builder.ToTable("barcode");
            builder.HasKey("Code");
            builder.Property(p => p.ProductId).IsRequired();
        }
    }
}
