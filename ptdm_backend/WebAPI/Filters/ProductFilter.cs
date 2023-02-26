using AspNetCore.IQueryable.Extensions.Attributes;
using WebAPI.Models;

namespace WebAPI.Filters
{
    public class ProductFilter : CustomFilter
    {
        public Guid? Id { get; set; }
        [QueryOperator(Operator = AspNetCore.IQueryable.Extensions.Filter.WhereOperator.Contains)]
        public string? Description { get; set; }
    }
}
