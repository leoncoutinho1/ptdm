using AspNetCore.IQueryable.Extensions.Attributes;
using AspNetCore.IQueryable.Extensions.Filter;

namespace ptdm.Domain.Filters
{
    public class SaleFilter : CustomFilter
    {
        public Guid? Id { get; set; }
        public Guid? CheckoutId { get; set; }
        public Guid? CashierId { get; set; }
        public Guid? PaymentFormId { get; set; }
        [QueryOperator(Operator = WhereOperator.GreaterThanOrEqualWhenNullable)]
        public DateTime? UpdatedAt { get; set; }
    }
}
