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
public class SaleController : ControllerBase
{
    private readonly ISaleService _service;

    public SaleController(ISaleService service)
    {
        _service = service;
    }

    [HttpGet("ListSale")]
    public ActionResult<ResultList<SaleDTO>> ListSale([FromQuery] SaleFilter filters)
    {
        var sales = _service.ListSale(filters);

        return Ok(sales);
    }

    [HttpGet("{id}", Name = "GetSaleById")]
    public ActionResult<Sale> Get(Guid id)
    {
        var sale = _service.Get(id);
        
        if (sale.IsError)
            return BadRequest(sale.Errors);

        return Ok(sale);
    }

    [HttpPost]
    public ActionResult Post([FromBody] SaleDTO saleDto)
    {
        
        var result = _service.Create(saleDto);

        return result.IsError 
            ? BadRequest(result.Errors) 
            : Created();
    }
        
    [HttpDelete("{id}")]
    public ActionResult<Sale> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }
}