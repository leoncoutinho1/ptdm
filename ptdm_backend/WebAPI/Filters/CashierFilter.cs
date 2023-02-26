using AspNetCore.IQueryable.Extensions.Attributes;

namespace WebAPI.Filters
{
    public class CashierFilter : CustomFilter
    {
        public Guid? Id { get; set; }
        [QueryOperator(Operator = AspNetCore.IQueryable.Extensions.Filter.WhereOperator.Contains)]
        public string? Name { get; set; }
    }
}
