namespace ptdm.Domain.DTOs;

/// <summary>
/// DTO para inserir ou atualizar a composição de um produto
/// </summary>
public class ProductCompositionInsertDTO
{
    public Guid ComponentProductId { get; set; }
    public double Quantity { get; set; }
}
