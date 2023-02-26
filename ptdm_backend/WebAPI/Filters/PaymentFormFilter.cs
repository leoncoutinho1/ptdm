using AspNetCore.IQueryable.Extensions.Attributes;

namespace WebAPI.Filters
{
    public class PaymentFormFilter : CustomFilter
    {
        public Guid? Id { get; set; }
        [QueryOperator(Operator = AspNetCore.IQueryable.Extensions.Filter.WhereOperator.Contains)]
        public string? Description { get; set; }
    }
}
