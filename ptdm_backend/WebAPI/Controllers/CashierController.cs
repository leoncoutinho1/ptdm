using ErrorOr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using ptdm.Service.Services;

namespace ptdm.Api.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class CashierController : ControllerBase
{
    private readonly ICashierService _service;

    public CashierController(ICashierService service)
    {
        _service = service;
    }

    [HttpGet("ListCashier")]
    public ActionResult<ResultList<Cashier>> ListCashier([FromQuery] CashierFilter filters)
    {
        ResultList<Cashier> result = _service.ListCashier(filters);
        return Ok(result);
    }

    [HttpGet("{id}", Name = "GetCashierById")]
    public ActionResult<ErrorOr<Cashier>> Get(Guid id)
    {
        var result = _service.Get(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);

    }

    [HttpPost]
    public ActionResult<ErrorOr<Cashier>> Post(CashierInsertDTO cashier)
    {
        var result = _service.Create(cashier);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }
    
    [HttpPut("{id}")]
    public ActionResult Put([FromRoute] Guid id, [FromBody] CashierUpdateDTO cashier)
    {
        if (id != cashier.Id)
        {
            return BadRequest("Route id is different of model id");
        }
        var result = _service.Update(cashier);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpDelete("{id}")]
    public ActionResult<Cashier> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }
}