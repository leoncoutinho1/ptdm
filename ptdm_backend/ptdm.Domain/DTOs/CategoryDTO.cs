using ptdm.Domain.Models;

namespace ptdm.Domain.DTOs;

public class CategoryDTO
{
    public Guid Id { get; set; }
    public string Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public static implicit operator CategoryDTO(Category c)
    {
        if (c == null) return null;
        return new CategoryDTO
        {
            Id = c.Id,
            Description = c.Description,
            CreatedAt = c.CreatedAt,
            CreatedBy = c.CreatedBy,
            UpdatedAt = c.UpdatedAt,
            UpdatedBy = c.UpdatedBy
        };
    }

    public static implicit operator Category(CategoryDTO dto)
    {
        if (dto == null) return null;
        return new Category
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
