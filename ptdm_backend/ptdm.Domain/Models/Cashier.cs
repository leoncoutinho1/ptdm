namespace ptdm.Domain.Models;

public class Cashier : BaseModel
{
    public string Name { get; set; }
    public ICollection<Sale> Sales { get; set; }
}