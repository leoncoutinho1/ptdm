namespace ptdm.Domain.Models;

/// <summary>
/// Representa a composição de produtos compostos.
/// Define quais produtos componentes fazem parte de um produto composto e em que quantidade.
/// </summary>
public class ProductComposition : BaseModel
{
    /// <summary>
    /// ID do produto composto (produto principal)
    /// </summary>
    public Guid CompositeProductId { get; set; }
    
    /// <summary>
    /// Produto composto (produto principal)
    /// </summary>
    public virtual Product CompositeProduct { get; set; }
    
    /// <summary>
    /// ID do produto componente (produto que faz parte da composição)
    /// </summary>
    public Guid ComponentProductId { get; set; }
    
    /// <summary>
    /// Produto componente (produto que faz parte da composição)
    /// </summary>
    public virtual Product ComponentProduct { get; set; }
    
    /// <summary>
    /// Quantidade do produto componente que será consumida na venda do produto composto
    /// </summary>
    public double Quantity { get; set; }
}
