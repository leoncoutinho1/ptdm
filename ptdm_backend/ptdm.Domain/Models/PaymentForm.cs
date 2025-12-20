namespace ptdm.Domain.Models;

public class PaymentForm : BaseModel
{
    public string Description { get; set; }
    public virtual ICollection<Sale> Sales { get; set; }
}