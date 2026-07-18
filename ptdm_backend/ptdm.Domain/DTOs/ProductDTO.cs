using ptdm.Domain.Models;

namespace ptdm.Domain.DTOs;

public class ProductDTO
{
    public Guid Id { get; set; }
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double ProfitMargin { get; set; }
    public Double Quantity { get; set; }
    public string Unit { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryDescription { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public string? ImageUrl { get; set; } = String.Empty;
    public bool IsActive { get; set; } = true;
    public bool Composite { get; set; } = false;
    public int ValidityDays { get; set; } = 0;
    public bool IntegrateScale { get; set; } = false;
    public string? MainBarcode { get; set; } = string.Empty;
    public virtual ICollection<string> Barcodes { get; set; }
    public virtual ICollection<ProductCompositionDTO>? ComponentProducts { get; set; }
}