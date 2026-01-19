using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ptdm.Domain.DTOs;
using ptdm.Service.Services;

namespace ptdm.Api.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Gera relatório de produtos em PDF
    /// </summary>
    /// <param name="request">Filtros do relatório (categorias opcionais)</param>
    /// <returns>Arquivo PDF do relatório</returns>
    [HttpPost("products")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult GenerateProductReport([FromBody] ProductReportRequestDTO request)
    {
        try
        {
            var pdfBytes = _reportService.GenerateProductReport(request);
            var fileName = $"relatorio_produtos_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
            
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = "Erro ao gerar relatório", message = ex.Message });
        }
    }

    /// <summary>
    /// Obtém dados do relatório de produtos em formato JSON (sem gerar PDF)
    /// </summary>
    /// <param name="request">Filtros do relatório (categorias opcionais)</param>
    /// <returns>Dados estruturados do relatório</returns>
    [HttpPost("products/data")]
    [ProducesResponseType(typeof(ProductReportDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<ProductReportDTO> GetProductReportData([FromBody] ProductReportRequestDTO request)
    {
        try
        {
            var reportData = _reportService.GetProductReportData(request);
            return Ok(reportData);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = "Erro ao obter dados do relatório", message = ex.Message });
        }
    }
}
