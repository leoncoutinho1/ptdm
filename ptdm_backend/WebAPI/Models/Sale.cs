using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace WebAPI.Models;
[Table("sale")]
public class Sale
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Key]
    public Guid Id { get; set; }
    [Required]
    [ForeignKey("Checkout")]
    public Guid CheckoutId { get; set; }
    public virtual Checkout? Checkout { get; set; }
    [Required] 
    [ForeignKey("Cashier")]
    public Guid CashierId { get; set; }
    public virtual Cashier? Cashier { get; set; }
    [Required]
    public Double TotalValue { get; set; }
    [Required]
    public Double PaidValue { get; set; }
    [Required]
    public Double ChangeValue { get; set; }
    [Required]
    public Double OverallDiscount { get; set; }
    [Required]
    [ForeignKey("PaymentForm")]
    
    public Guid PaymentFormId { get; set; }
    public virtual PaymentForm? PaymentForm { get; set; }
    [Required]
    public IEnumerable<SaleProduct> SaleProducts { get; set; }
    [Required]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public DateTime CreatedAt { get; set; }
}