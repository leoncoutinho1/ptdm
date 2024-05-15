using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace WebAPI.Models;

public class SaleProduct
{
    public Guid SaleId { get; set; }
    [JsonIgnore]
    public virtual Sale? Sale { get; set; }
    public Guid ProductId { get; set; }
    public virtual Product? Product { get; set; }
    public Double Quantity { get; set; }
    public Double Discount { get; set; } = 0;
}