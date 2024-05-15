using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace WebAPI.Models;

public class PaymentForm : BaseModel
{
    public string Description { get; set; }
    [JsonIgnore]
    public ICollection<Sale> Sales { get; set; }
}