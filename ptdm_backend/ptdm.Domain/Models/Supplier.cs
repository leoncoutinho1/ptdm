namespace ptdm.Domain.Models;

public class Supplier : BaseModel
{
    public string Description { get; set; } = string.Empty;
    public virtual ICollection<Payable>? Payables { get; set; }
}
