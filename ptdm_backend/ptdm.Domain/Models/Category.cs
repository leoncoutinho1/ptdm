namespace ptdm.Domain.Models;

public class Category : BaseModel
{
    public string Description { get; set; }
    public virtual ICollection<Product> Products { get; set; }
}
