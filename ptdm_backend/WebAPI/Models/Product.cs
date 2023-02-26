using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace WebAPI.Models;

[Table("product")]
public class Product
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Key]
    public Guid Id { get; set; }
    [Required]
    [StringLength(100)]
    public String Description { get; set; }
    [Required]
    public Double Cost { get; set; }
    [Required]
    public Double Price { get; set; }
    [Required]
    public Double Quantity { get; set; }
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public DateTime CreatedAt { get; set; }
    public ICollection<Barcode> Barcodes { get; set; }
}
