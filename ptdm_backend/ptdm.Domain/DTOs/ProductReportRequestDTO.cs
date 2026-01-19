namespace ptdm.Domain.DTOs;

/// <summary>
/// DTO para requisição de relatório de produtos
/// </summary>
public class ProductReportRequestDTO
{
    /// <summary>
    /// Lista de IDs de categorias para filtrar. Se vazio ou null, traz todas as categorias.
    /// </summary>
    public List<Guid>? CategoryIds { get; set; }
}
