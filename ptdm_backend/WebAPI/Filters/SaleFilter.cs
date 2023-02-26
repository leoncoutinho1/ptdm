using AspNetCore.IQueryable.Extensions.Attributes;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using WebAPI.Models;

namespace WebAPI.Filters
{
    public class SaleFilter : CustomFilter
    {
        public Guid? Id { get; set; }
        public Guid? CheckoutId { get; set; }
        public Guid? CashierId { get; set; }
        public Guid? PaymentFormId { get; set; }
    }
}
