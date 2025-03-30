namespace ptdm.Domain.Models;

public class SaleProduct
{
    public Guid SaleId { get; set; }
    public virtual Sale? Sale { get; set; }
    public Guid ProductId { get; set; }
    public virtual Product? Product { get; set; }
    public Double Quantity { get; set; }
    public Double Discount { get; set; } = 0;
}