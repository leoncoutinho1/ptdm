namespace ptdm.Domain.DTOs;

public class ProductInsertDTO
{
    public Guid Id { get; set; }
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double ProfitMargin { get; set; }
    public Double Quantity { get; set; }
    public Guid? CategoryId { get; set; }
    public string? ImageUrl { get; set; } = String.Empty;
    public bool IsActive { get; set; } = true;
    public bool Composite { get; set; } = false;
    public virtual ICollection<string> Barcodes { get; set; }
    public List<ProductCompositionInsertDTO>? ComponentProducts { get; set; }
}