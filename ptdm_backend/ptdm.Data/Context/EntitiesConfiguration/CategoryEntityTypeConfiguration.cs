using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using ptdm.Domain.Models;

namespace ptdm.Data.Context.EntitiesConfiguration
{
    public class CategoryEntityTypeConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.ToTable("category");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Id).IsRequired();
            builder.Property(c => c.CreatedAt).IsRequired();
            builder.Property(c => c.Description).IsRequired().HasMaxLength(100);

            builder.HasMany(c => c.Products)
                   .WithOne(p => p.Category)
                   .HasForeignKey(p => p.CategoryId);
        }
    }
}
