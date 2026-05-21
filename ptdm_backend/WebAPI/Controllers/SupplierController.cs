using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Service.Services;

namespace ptdm.Api.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[Authorize]
public class SupplierController : ControllerBase
{
    private readonly ISupplierService _service;

    public SupplierController(ISupplierService service)
    {
        _service = service;
    }

    [HttpGet("ListSupplier")]
    public ActionResult<ResultList<SupplierDTO>> ListSupplier([FromQuery] SupplierFilter filters)
    {
        ResultList<SupplierDTO> result = _service.ListSupplier(filters);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public ActionResult<SupplierDTO> Get(Guid id)
    {
        var result = _service.Get(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result.Value);
    }

    [HttpPost]
    public ActionResult Post([FromBody] SupplierInsertDTO supplier)
    {
        var result = _service.Create(supplier);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpPut("{id}")]
    public ActionResult Put(Guid id, SupplierUpdateDTO supplier)
    {
        if (id != supplier.Id)
        {
            return BadRequest("Route id is different from model id");
        }
        var result = _service.Update(supplier);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpDelete("{id}")]
    public ActionResult<SupplierDTO> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result.Value);
    }
}
