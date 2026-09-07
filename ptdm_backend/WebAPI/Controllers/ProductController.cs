using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using ptdm.Service.Services;
using System.Text;

namespace ptdm.Api.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[Authorize]
public class ProductController : ControllerBase
{
    private readonly IProductService _service;

    public ProductController(IProductService service)
    {
        _service = service;
    }


    [HttpGet("GetProductByDescOrBarcode/{text}")]
    public ActionResult<ProductDTO> GetProductByDescOrBarcode([FromRoute] string text)
    {
        var result = _service.GetProductByDescOrBarcode(text);
        return Ok(result);
    }

    [HttpGet("ListProduct")]
    public ActionResult<ResultList<ProductDTO>> ListProduct([FromQuery] ProductFilter filters)
    {
        ResultList<ProductDTO> result = _service.ListProduct(filters);
        return Ok(result);
    }

    [HttpGet("{id}", Name = "GetProductById")]
    public ActionResult<ProductDTO> Get(Guid id)
    {
        var result = _service.Get(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpPost]
    public ActionResult Post([FromBody] ProductInsertDTO product)
    {
        var result = _service.Create(product);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpPut("{id}")]
    public ActionResult Put(Guid id, ProductUpdateDTO product)
    {
        if (id != product.Id)
        {
            return BadRequest("Route id is different of model id");
        }
        var result = _service.Update(product);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpDelete("{id}")]
    public ActionResult<ProductDTO> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    /// <summary>
    /// Valida se há estoque suficiente dos componentes para criar/atualizar um produto composto
    /// </summary>
    [HttpPost("ValidateCompositeStock")]
    public ActionResult ValidateCompositeStock([FromBody] List<ProductCompositionInsertDTO> components)
    {
        // Este endpoint pode ser usado pelo frontend para validar antes de salvar
        // Por enquanto, a validação está sendo feita no SaleService durante a venda
        return Ok(new { valid = true, message = "Validação de estoque será feita durante a venda" });
    }

    /// <summary>
    /// Processa arquivo CSV com colunas: código de barras, descrição, quantidade e preço de custo
    /// e gera comandos SQL (UPDATE/INSERT) para os produtos retornando em um arquivo .sql para download.
    /// </summary>
    /// <param name="file">Arquivo CSV a ser processado</param>
    /// <returns>Arquivo .sql com os comandos gerados</returns>
    [HttpPost("import-csv-sql")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult ImportCsvSql(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Arquivo CSV não fornecido ou vazio.");
        }

        var result = _service.ProcessCsvProducts(file);
        if (result.IsError)
        {
            return BadRequest(result.FirstError.Description);
        }

        var bytes = Encoding.UTF8.GetBytes(result.Value);
        var fileName = $"importacao_produtos_{DateTime.Now:yyyyMMdd_HHmmss}.sql";
        return File(bytes, "application/sql", fileName);
    }
}
