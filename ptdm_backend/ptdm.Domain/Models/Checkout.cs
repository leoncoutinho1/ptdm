namespace ptdm.Domain.Models;

public class Checkout : BaseModel
{
    public string Name { get; set; }
    public virtual ICollection<Sale> Sales { get; set; }
}