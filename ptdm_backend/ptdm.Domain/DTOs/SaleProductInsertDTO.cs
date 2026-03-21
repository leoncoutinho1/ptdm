namespace ptdm.Domain.DTOs;

public class SaleProductInsertDTO
{
    public Guid ProductId { get; set; }
    public Double UnitPrice { get; set; }
    public Double Quantity { get; set; }
    public Double? Discount { get; set; } = 0;
}