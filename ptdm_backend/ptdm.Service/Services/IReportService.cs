using ptdm.Domain.DTOs;

namespace ptdm.Service.Services;

public interface IReportService
{
    /// <summary>
    /// Gera relatório de produtos em PDF
    /// </summary>
    /// <param name="request">Filtros do relatório</param>
    /// <returns>Bytes do arquivo PDF</returns>
    byte[] GenerateProductReport(ProductReportRequestDTO request);
    
    /// <summary>
    /// Obtém dados do relatório de produtos sem gerar PDF
    /// </summary>
    /// <param name="request">Filtros do relatório</param>
    /// <returns>Dados estruturados do relatório</returns>
    ProductReportDTO GetProductReportData(ProductReportRequestDTO request);
}
