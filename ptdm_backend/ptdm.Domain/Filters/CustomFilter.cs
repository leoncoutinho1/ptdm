using AspNetCore.IQueryable.Extensions;
using AspNetCore.IQueryable.Extensions.Pagination;
using AspNetCore.IQueryable.Extensions.Sort;

namespace ptdm.Domain.Filters
{
    public class CustomFilter : ICustomQueryable, IQueryPaging, IQuerySort
    {
        public int? Limit { get; set; }
        public int? Offset { get; set; }
        public string? Sort { get; set; }
    }
}
