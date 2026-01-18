using ptdm.Domain.DTOs;
using System.Runtime.CompilerServices;

namespace ptdm.Domain.Models;

public class Product : BaseModel
{
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double ProfitMargin { get; set; }
    public Double Quantity { get; set; }
    public string Unit { get; set; } = String.Empty;
    public string? ImageUrl { get; set; } = String.Empty;
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Indica se este produto é um produto composto (formado por outros produtos)
    /// </summary>
    public bool Composite { get; set; } = false;
  
    public Guid? CategoryId { get; set; }
    public virtual Category? Category { get; set; }
  
    public virtual ICollection<Barcode> Barcodes { get; set; }
    public virtual ICollection<SaleProduct> SaleProducts { get; set; }
    
    /// <summary>
    /// Produtos que este produto compõe (quando este produto é um componente)
    /// </summary>
    public virtual ICollection<ProductComposition> CompositeProducts { get; set; }
    
    /// <summary>
    /// Produtos que compõem este produto (quando este produto é composto)
    /// </summary>
    public virtual ICollection<ProductComposition> ComponentProducts { get; set; }

    public static implicit operator ProductDTO(Product p)
    {
        return new ProductDTO
        {
            Id = p.Id,
            Description = p.Description,
            Cost = p.Cost,
            ProfitMargin = p.ProfitMargin,
            Price = p.Price,
            Quantity = p.Quantity,
            Unit = p.Unit,
            CategoryId = p.CategoryId,
            CategoryDescription = p.Category?.Description,
            CreatedAt = p.CreatedAt,
            ImageUrl = p.ImageUrl,
            IsActive = p.IsActive,
            Composite = p.Composite,
            Barcodes = p.Barcodes.Select(x => x.Code).ToList(),
            ComponentProducts = p.ComponentProducts?.Select(cp => new ProductCompositionDTO
            {
                ComponentProductId = cp.ComponentProductId,
                ComponentProductDescription = cp.ComponentProduct?.Description ?? string.Empty,
                Quantity = cp.Quantity,
                ComponentProductPrice = cp.ComponentProduct?.Price ?? 0,
                ComponentProductCost = cp.ComponentProduct?.Cost ?? 0
            }).ToList()
        };
    }
}
