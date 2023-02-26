using System.ComponentModel.DataAnnotations;
using WebAPI.Models;

namespace WebAPI.DTOs;

public class SaleDTO
{
    public Guid Id { get; set; }
    public Guid CheckoutId { get; set; }
    public Guid CashierId { get; set; }
    public Double TotalValue { get; set; }
    public Double PaidValue { get; set; }
    public Double ChangeValue { get; set; }
    public Double OverallDiscount { get; set; }
    public Guid PaymentFormId { get; set; }
    public IEnumerable<SaleProductDTO> SaleProducts { get; set; }
}