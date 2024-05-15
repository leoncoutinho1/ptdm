using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


namespace WebAPI.Models;
[Table("cashier")]
public class Cashier : BaseModel
{
    public string Name { get; set; }
    [JsonIgnore]
    public ICollection<Sale> Sales { get; set; }
}