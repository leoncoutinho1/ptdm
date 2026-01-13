namespace ptdm.Domain.DTOs;

/// <summary>
/// DTO para representar a composição de um produto
/// </summary>
public class ProductCompositionDTO
{
    public Guid ComponentProductId { get; set; }
    public string ComponentProductDescription { get; set; }
    public double Quantity { get; set; }
    public double ComponentProductPrice { get; set; }
    public double ComponentProductCost { get; set; }
}
