namespace ptdm.Domain.Filters
{
    public class SaleProductFilter : CustomFilter
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public Guid SaleId { get; set; }
    }
}
