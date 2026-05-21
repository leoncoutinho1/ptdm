using ptdm.Domain.Models;

namespace ptdm.Domain.DTOs;

public class PayableDTO
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public string? SupplierDescription { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public double Value { get; set; }
    public bool Paid { get; set; }
    public string? Attachment { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public static implicit operator PayableDTO(Payable p)
    {
        if (p == null) return null;
        return new PayableDTO
        {
            Id = p.Id,
            SupplierId = p.SupplierId,
            SupplierDescription = p.Supplier?.Description,
            InvoiceDate = p.InvoiceDate,
            DueDate = p.DueDate,
            Value = p.Value,
            Paid = p.Paid,
            Attachment = p.Attachment,
            CreatedAt = p.CreatedAt,
            CreatedBy = p.CreatedBy,
            UpdatedAt = p.UpdatedAt,
            UpdatedBy = p.UpdatedBy
        };
    }

    public static implicit operator Payable(PayableDTO dto)
    {
        if (dto == null) return null;
        return new Payable
        {
            Id = dto.Id,
            SupplierId = dto.SupplierId,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            Value = dto.Value,
            Paid = dto.Paid,
            Attachment = dto.Attachment,
            CreatedAt = dto.CreatedAt,
            CreatedBy = dto.CreatedBy,
            UpdatedAt = dto.UpdatedAt,
            UpdatedBy = dto.UpdatedBy
        };
    }
}
