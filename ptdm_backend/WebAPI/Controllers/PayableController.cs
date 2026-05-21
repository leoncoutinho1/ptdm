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
public class PayableController : ControllerBase
{
    private readonly IPayableService _service;

    public PayableController(IPayableService service)
    {
        _service = service;
    }

    [HttpGet("ListPayable")]
    public ActionResult<ResultList<PayableDTO>> ListPayable([FromQuery] PayableFilter filters)
    {
        ResultList<PayableDTO> result = _service.ListPayable(filters);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public ActionResult<PayableDTO> Get(Guid id)
    {
        var result = _service.Get(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result.Value);
    }

    [HttpPost]
    public ActionResult Post([FromBody] PayableInsertDTO payable)
    {
        var result = _service.Create(payable);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpPut("{id}")]
    public ActionResult Put(Guid id, PayableUpdateDTO payable)
    {
        if (id != payable.Id)
        {
            return BadRequest("Route id is different from model id");
        }
        var result = _service.Update(payable);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpDelete("{id}")]
    public ActionResult<PayableDTO> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result.Value);
    }
}
