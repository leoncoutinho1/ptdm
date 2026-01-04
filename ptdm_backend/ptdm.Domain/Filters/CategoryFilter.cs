using AspNetCore.IQueryable.Extensions.Attributes;
using AspNetCore.IQueryable.Extensions.Filter;

namespace ptdm.Domain.Filters;

public class CategoryFilter : CustomFilter
{
    public Guid? Id { get; set; }
    [QueryOperator(Operator = WhereOperator.Contains)]
    public string? Description { get; set; }
    [QueryOperator(Operator = WhereOperator.GreaterThan)]
    public DateTime? UpdatedAt { get; set; }
}
