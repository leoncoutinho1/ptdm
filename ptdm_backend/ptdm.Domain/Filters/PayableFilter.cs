using AspNetCore.IQueryable.Extensions.Attributes;
using AspNetCore.IQueryable.Extensions.Filter;

namespace ptdm.Domain.Filters;

public class PayableFilter : CustomFilter
{
    public Guid? Id { get; set; }
    public Guid? SupplierId { get; set; }
    public bool? Paid { get; set; }
    [QueryOperator(Operator = WhereOperator.GreaterThanOrEqualWhenNullable)]
    public DateTime? DueDate { get; set; }
    [QueryOperator(Operator = WhereOperator.GreaterThanOrEqualWhenNullable)]
    public DateTime? UpdatedAt { get; set; }
}
