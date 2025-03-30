namespace ptdm.Domain.Filters
{
    public class SaleFilter : CustomFilter
    {
        public Guid? Id { get; set; }
        public Guid? CheckoutId { get; set; }
        public Guid? CashierId { get; set; }
        public Guid? PaymentFormId { get; set; }
    }
}
