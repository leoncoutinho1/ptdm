namespace ptdm.Domain.DTOs;

public class ProductDTO
{
    public Guid Id { get; set; }
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double ProfitMargin { get; set; }
    public Double Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<string> Barcodes { get; set; }
}