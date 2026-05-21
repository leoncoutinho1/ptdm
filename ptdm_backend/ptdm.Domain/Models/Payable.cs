namespace ptdm.Domain.Models;

public class Payable : BaseModel
{
    public Guid SupplierId { get; set; }
    public virtual Supplier? Supplier { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public double Value { get; set; }
    public bool Paid { get; set; } = false;
    public string? Attachment { get; set; }
}
