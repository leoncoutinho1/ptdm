using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebAPI.Models;

namespace WebAPI.Data.EntitiesConfiguration
{
    public class PaymentFormEntityTypeConfiguration : IEntityTypeConfiguration<PaymentForm>
    {
        public void Configure(EntityTypeBuilder<PaymentForm> builder)
        {
            builder.ToTable("payment_form");
            builder.HasKey("Id");
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.CreatedAt).IsRequired();
            builder.Property(p => p.Description).IsRequired().HasMaxLength(100);
        }
    }
}
