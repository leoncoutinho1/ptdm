namespace ptdm.Domain.DTOs;

public class ProductUpdateDTO
{
    public Guid Id { get; set; }
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double ProfitMargin { get; set; }
    public Double Quantity { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryDescription { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ImageUrl { get; set; } = String.Empty;
    public bool IsActive { get; set; } = true;
    public bool Composite { get; set; } = false;
    public virtual ICollection<string> Barcodes { get; set; }
    public List<ProductCompositionInsertDTO>? ComponentProducts { get; set; }

    public static implicit operator ProductDTO(ProductUpdateDTO dto)
    {
        return new ProductDTO
        {
            Id = dto.Id,
            Description = dto.Description,
            Cost = dto.Cost,
            Price = dto.Price,
            ProfitMargin = dto.ProfitMargin,
            Quantity = dto.Quantity,
            CategoryId = dto.CategoryId,
            ImageUrl = dto.ImageUrl,
            IsActive = dto.IsActive,
            Composite = dto.Composite,
            Barcodes = dto.Barcodes,
            ComponentProducts = dto.ComponentProducts.Select(x => new ProductCompositionDTO
            {
                Quantity = x.Quantity,
                ComponentProductId = x.ComponentProductId,
            }).ToList()
        };
    }
}