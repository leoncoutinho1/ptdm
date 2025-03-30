namespace ptdm.Domain.DTOs;

public class SaleProductDTO
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Double Quantity { get; set; }
    public Double Discount { get; set; }
}