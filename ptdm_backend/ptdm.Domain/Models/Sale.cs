namespace ptdm.Domain.Models;

public class Sale : BaseModel
{
    public Guid CheckoutId { get; set; }
    public virtual Checkout? Checkout { get; set; }
    public Guid CashierId { get; set; }
    public virtual Cashier? Cashier { get; set; }
    public Double TotalValue { get; set; } = 0;
    public Double PaidValue { get; set; } = 0;
    public Double ChangeValue { get; set; } = 0;
    public Double OverallDiscount { get; set; } = 0;
    public Guid PaymentFormId { get; set; }
    public virtual PaymentForm? PaymentForm { get; set; }
    public IEnumerable<SaleProduct> SaleProducts { get; set; }
}