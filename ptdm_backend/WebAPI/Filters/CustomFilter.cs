using AspNetCore.IQueryable.Extensions;
using AspNetCore.IQueryable.Extensions.Pagination;
using AspNetCore.IQueryable.Extensions.Sort;

namespace WebAPI.Filters
{
    public class CustomFilter : ICustomQueryable, IQueryPaging, IQuerySort
    {
        /// <summary>
        /// Quando não informado, limite de 50
        /// </summary>
        public int? Limit { get; set; } = 50;
        public int? Offset { get; set; }
        public string? Sort { get; set; }
    }
}
