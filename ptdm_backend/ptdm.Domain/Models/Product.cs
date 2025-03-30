namespace ptdm.Domain.Models;

public class Product : BaseModel
{
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double ProfitMargin { get; set; }
    public Double Quantity { get; set; }
    public ICollection<Barcode> Barcodes { get; set; }
    public ICollection<SaleProduct> SaleProducts { get; set; }
}
