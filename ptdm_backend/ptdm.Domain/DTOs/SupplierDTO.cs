using ptdm.Domain.Models;

namespace ptdm.Domain.DTOs;

public class SupplierDTO
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public static implicit operator SupplierDTO(Supplier s)
    {
        if (s == null) return null;
        return new SupplierDTO
        {
            Id = s.Id,
            Description = s.Description,
            CreatedAt = s.CreatedAt,
            CreatedBy = s.CreatedBy,
            UpdatedAt = s.UpdatedAt,
            UpdatedBy = s.UpdatedBy
        };
    }

    public static implicit operator Supplier(SupplierDTO dto)
    {
        if (dto == null) return null;
        return new Supplier
        {
            Id = dto.Id,
            Description = dto.Description,
            CreatedAt = dto.CreatedAt,
            CreatedBy = dto.CreatedBy,
            UpdatedAt = dto.UpdatedAt,
            UpdatedBy = dto.UpdatedBy
        };
    }
}
