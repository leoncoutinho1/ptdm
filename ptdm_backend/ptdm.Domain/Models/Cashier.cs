namespace ptdm.Domain.Models;

public class Cashier : BaseModel
{
    public string Name { get; set; }
    public virtual ICollection<Sale> Sales { get; set; }
}