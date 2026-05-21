using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using ptdm.Domain.Models;

namespace ptdm.Data.Context.EntitiesConfiguration
{
    public class PayableEntityTypeConfiguration : IEntityTypeConfiguration<Payable>
    {
        public void Configure(EntityTypeBuilder<Payable> builder)
        {
            builder.ToTable("payable");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Id).IsRequired();
            builder.Property(p => p.CreatedAt).IsRequired();
            builder.Property(p => p.DueDate).IsRequired();
            builder.Property(p => p.Value).IsRequired();
            builder.Property(p => p.Paid).IsRequired();
            builder.Property(p => p.Attachment);

            builder.HasOne(p => p.Supplier)
                   .WithMany(s => s.Payables)
                   .HasForeignKey(p => p.SupplierId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
