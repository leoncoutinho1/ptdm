namespace ptdm.Domain.DTOs;

/// <summary>
/// DTO para dados de produto no relatório
/// </summary>
public class ProductReportItemDTO
{
    public string Barcode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Quantity { get; set; }
    public double Cost { get; set; }
    public double Price { get; set; }
}

/// <summary>
/// DTO para agrupamento por categoria no relatório
/// </summary>
public class ProductReportCategoryDTO
{
    public string CategoryDescription { get; set; } = string.Empty;
    public List<ProductReportItemDTO> Products { get; set; } = new();
    public double TotalCost { get; set; }
}

/// <summary>
/// DTO completo do relatório de produtos
/// </summary>
public class ProductReportDTO
{
    public List<ProductReportCategoryDTO> Categories { get; set; } = new();
    public double GrandTotalCost { get; set; }
    public DateTime GeneratedAt { get; set; }
}
