namespace ptdm.Domain.DTOs;

public class SaleProductDTO
{
    public Guid SaleId { get; set; }
    public Guid ProductId { get; set; }
    public Double UnitPrice { get; set; }
    public virtual ProductDTO? Product { get; set; }
    public Double Quantity { get; set; }
    public Double Discount { get; set; }
}