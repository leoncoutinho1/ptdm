namespace ptdm.Domain.DTOs;

/// <summary>
/// DTO de requisição para o relatório de vendas
/// </summary>
public class SaleReportRequestDTO
{
    /// <summary>
    /// Data inicial do período (filtro em SaleDate)
    /// </summary>
    public DateTime? InitialDate { get; set; }

    /// <summary>
    /// Data final do período (filtro em SaleDate)
    /// </summary>
    public DateTime? FinalDate { get; set; }

    /// <summary>
    /// Lista de IDs de categorias para filtrar. Se vazio ou null, considera todas as categorias.
    /// </summary>
    public List<Guid>? CategoryIds { get; set; }

    /// <summary>
    /// Se verdadeiro, exibe os produtos individuais por categoria.
    /// Se falso, exibe apenas os totais por categoria (sumarizado).
    /// </summary>
    public bool Detailed { get; set; } = true;
}

/// <summary>
/// DTO de um item de produto dentro do agrupamento por categoria no relatório de vendas
/// </summary>
public class SaleReportProductItemDTO
{
    public string ProductDescription { get; set; } = string.Empty;
    public string CategoryDescription { get; set; } = string.Empty;
    public double TotalQuantity { get; set; }
    public double TotalValue { get; set; }
    public double TotalDiscount { get; set; }
}

/// <summary>
/// DTO de agrupamento por categoria dentro de um dia
/// </summary>
public class SaleReportDayCategoryDTO
{
    public string CategoryDescription { get; set; } = string.Empty;
    public List<SaleReportProductItemDTO> Products { get; set; } = new();
    public double CategoryTotalValue { get; set; }
    public double CategoryTotalDiscount { get; set; }
    public double CategoryTotalQuantity { get; set; }
}

/// <summary>
/// DTO de sumarização por dia
/// </summary>
public class SaleReportDayDTO
{
    public DateTime Date { get; set; }
    public List<SaleReportDayCategoryDTO> Categories { get; set; } = new();
    public double DayTotalValue { get; set; }
    public double DayTotalDiscount { get; set; }
}

/// <summary>
/// DTO completo do relatório de vendas
/// </summary>
public class SaleReportDTO
{
    public List<SaleReportDayDTO> Days { get; set; } = new();
    public double GrandTotalValue { get; set; }
    public double GrandTotalDiscount { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime? InitialDate { get; set; }
    public DateTime? FinalDate { get; set; }
    public bool Detailed { get; set; } = true;
}
