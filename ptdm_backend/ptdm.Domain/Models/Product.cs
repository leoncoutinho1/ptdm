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
    public string? ImageUrl { get; set; } = String.Empty;
    public bool IsActive { get; set; } = true;
  
    public Guid? CategoryId { get; set; }
    public virtual Category? Category { get; set; }
  
    public virtual ICollection<Barcode> Barcodes { get; set; }
    public virtual ICollection<SaleProduct> SaleProducts { get; set; }

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
            CategoryId = p.CategoryId,
            CategoryDescription = p.Category?.Description,
            CreatedAt = p.CreatedAt,
            ImageUrl = p.ImageUrl,
            IsActive = p.IsActive,
            Barcodes = p.Barcodes.Select(x => x.Code).ToList()
        };
    }
}
