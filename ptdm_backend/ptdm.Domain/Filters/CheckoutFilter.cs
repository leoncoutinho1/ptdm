using AspNetCore.IQueryable.Extensions.Attributes;
using AspNetCore.IQueryable.Extensions.Filter;

namespace ptdm.Domain.Filters
{
    public class CheckoutFilter : CustomFilter
    {
        public Guid? Id { get; set; }
        [QueryOperator(Operator = WhereOperator.Contains)]
        public string? Name { get; set; }
    }
}
