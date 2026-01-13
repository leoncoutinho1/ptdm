using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using ptdm.Service.Services;

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

    //[HttpPost("loadProducts")]
    //public ActionResult LoadProducts([Required] IFormFile file)
    //{
    //    using (var reader = new StreamReader(file.OpenReadStream()))
    //    {
    //        var count = 0;
    //        reader.ReadLine(); // pular o cabeçalho da planilha
    //        while (!reader.EndOfStream) {
    //            var line = reader.ReadLine().Split('\t');
    //            if (line == null || line.Length == 0)
    //                break;

    //            var product = new Product();
    //            product.Description = line[0];
    //            product.Cost = Double.Parse(line[1]);
    //            product.Price = Double.Parse(line[2]);
    //            product.Quantity = Double.Parse(line[3]);

    //            _uof.ProductRepository.Add(product);

    //            if (line.Length > 4)
    //            {
    //                for(var i = 4; i < line.Length; i++)
    //                {
    //                    if (String.IsNullOrWhiteSpace(line[i]))
    //                        continue;

    //                    var barcode = new Barcode()
    //                    {
    //                        Code = line[i],
    //                        ProductId = product.Id
    //                    };

    //                    _uof.BarcodeRepository.Add(barcode);
    //                }
    //            }
    //        }
    //        _uof.Commit();
    //    }
    //    return Ok();
    //}
}
