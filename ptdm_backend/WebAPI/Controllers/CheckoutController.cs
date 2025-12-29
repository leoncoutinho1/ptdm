using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions;
using Microsoft.AspNetCore.Mvc;
using AspNetCore.IQueryable.Extensions.Sort;
using AspNetCore.IQueryable.Extensions.Pagination;
using Microsoft.AspNetCore.Authorization;
using ErrorOr;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using ptdm.Service.Services;
using ptdm.Domain.DTOs;

namespace ptdm.Api.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _service;

    public CheckoutController(ICheckoutService service)
    {
        _service = service;
    }

    [HttpGet("ListCheckout")]
    public ActionResult<ResultList<Checkout>> ListCheckout([FromQuery] CheckoutFilter filters)
    {
        ResultList<Checkout> result = _service.ListCheckout(filters);
        return Ok(result);
    }

    [HttpGet("{id}", Name = "GetCheckoutById")]
    public ActionResult<ErrorOr<Checkout>> Get(Guid id)
    {
        var result = _service.Get(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);

    }

    [HttpPost]
    public ActionResult<ErrorOr<Checkout>> Post([FromBody] CheckoutInsertDTO dto)
    {
        var result = _service.Create(dto);
        return (result.IsError)
            ? BadRequest(result)
            : Created();
    }

    [HttpPut("{id}")]
    public ActionResult Put([FromRoute] Guid id, [FromBody] CheckoutUpdateDTO dto)
    {
        if (id != dto.Id)
        {
            return BadRequest("Route id is different of model id");
        }
        var result = _service.Update(dto);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpDelete("{id}")]
    public ActionResult<Checkout> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }
}