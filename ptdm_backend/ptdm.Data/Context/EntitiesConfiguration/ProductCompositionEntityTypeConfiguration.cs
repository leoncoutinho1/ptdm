using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ptdm.Domain.Models;

namespace ptdm.Data.Context.EntitiesConfiguration
{
    public class ProductCompositionEntityTypeConfiguration : IEntityTypeConfiguration<ProductComposition>
    {
        public void Configure(EntityTypeBuilder<ProductComposition> builder)
        {
            builder.ToTable("product_composition");
            
            // Chave composta
            builder.HasKey(pc => new { pc.CompositeProductId, pc.ComponentProductId });
            
            // Relacionamento: Produto Composto -> Componentes
            builder
                .HasOne(pc => pc.CompositeProduct)
                .WithMany(p => p.ComponentProducts)
                .HasForeignKey(pc => pc.CompositeProductId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
            
            // Relacionamento: Produto Componente -> Produtos que ele compõe
            builder
                .HasOne(pc => pc.ComponentProduct)
                .WithMany(p => p.CompositeProducts)
                .HasForeignKey(pc => pc.ComponentProductId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
            
            // Propriedades
            builder.Property(pc => pc.Quantity)
                .IsRequired()
                .HasDefaultValue(1);
        }
    }
}
