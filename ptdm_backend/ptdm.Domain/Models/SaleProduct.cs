using ptdm.Domain.DTOs;

namespace ptdm.Domain.Models;

public class SaleProduct
{
    public Guid SaleId { get; set; }
    public virtual Sale? Sale { get; set; }
    public Guid ProductId { get; set; }
    public virtual Product? Product { get; set; }
    public Double Quantity { get; set; }
    public Double Discount { get; set; } = 0;

    public static implicit operator SaleProductDTO(SaleProduct sp)
    {
        return new SaleProductDTO
        {
            SaleId = sp.SaleId,
            ProductId = sp.ProductId,
            Quantity = sp.Quantity,
            Discount = sp.Discount
        };
    }
}