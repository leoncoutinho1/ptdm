namespace ptdm.Domain.DTOs;

public class ProductInsertDTO
{
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double Quantity { get; set; }
    public string Barcode { get; set; }
    public string ImageUrl { get; set; }
    public Guid? CategoryId { get; set; }
}