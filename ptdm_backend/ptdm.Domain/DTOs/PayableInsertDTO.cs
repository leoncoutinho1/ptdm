namespace ptdm.Domain.DTOs;

public class PayableInsertDTO
{
    public Guid SupplierId { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public double Value { get; set; }
    public bool Paid { get; set; }
    public string? Attachment { get; set; }
}
