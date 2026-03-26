namespace ptdm.Domain.DTOs;

public class SaleInsertDTO
{
    public Guid Id { get; set; }
    public Guid CheckoutId { get; set; }
    public Guid CashierId { get; set; }
    public Double TotalValue { get; set; }
    public Double PaidValue { get; set; }
    public Double ChangeValue { get; set; }
    public Double OverallDiscount { get; set; }
    public Guid PaymentFormId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SaleDate { get; set; }
    public IEnumerable<SaleProductInsertDTO> SaleProducts { get; set; }
}