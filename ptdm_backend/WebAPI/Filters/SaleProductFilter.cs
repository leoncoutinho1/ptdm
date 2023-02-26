using AspNetCore.IQueryable.Extensions.Attributes;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using WebAPI.Models;

namespace WebAPI.Filters
{
    public class SaleProductFilter : CustomFilter
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public Guid SaleId { get; set; }
    }
}
