using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace WebAPI.Models;
[Table("sale_product")]
public class SaleProduct
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Key]
    public Guid Id { get; set; }
    [Required]
    [ForeignKey("Product")]
    public Guid ProductId { get; set; }
    public virtual Product? Product { get; set; }
    [Required]
    public Double Quantity { get; set; }
    public Double Discount { get; set; }
}