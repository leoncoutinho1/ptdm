using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace WebAPI.Models;

public class Product : BaseModel
{
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double ProfitMargin { get; set; }
    public Double Quantity { get; set; }
    public ICollection<Barcode> Barcodes { get; set; }
    [JsonIgnore]
    public ICollection<SaleProduct> SaleProducts { get; set; }
}
