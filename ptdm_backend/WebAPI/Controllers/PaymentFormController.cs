using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ErrorOr;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using ptdm.Service.Services;

namespace ptdm.Api.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[Authorize]
public class PaymentFormController : ControllerBase
{
    private readonly IPaymentFormService _service;

    public PaymentFormController(IPaymentFormService service)
    {
        _service = service;
    }

    [HttpGet("ListPaymentForm")]
    public ActionResult<ResultList<PaymentForm>> ListPaymentForm([FromQuery] PaymentFormFilter filters)
    {
        ResultList<PaymentForm> result = _service.ListPaymentForm(filters);
        return Ok(result);
    }

    [HttpGet("{id}", Name = "GetPaymentFormById")]
    public ActionResult<ErrorOr<PaymentForm>> Get(Guid id)
    {
        var result = _service.Get(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);

    }

    [HttpPost]
    public ActionResult<ErrorOr<PaymentForm>> Post([FromBody] string paymentFormName)
    {
        var result = _service.Create(paymentFormName);
        return (result.IsError)
            ? BadRequest(result)
            : Created();
    }

    [HttpPut("{id}")]
    public ActionResult Put(Guid id, PaymentForm paymentForm)
    {
        if (id != paymentForm.Id)
        {
            return BadRequest("Route id is different of model id");
        }
        var result = _service.Update(paymentForm);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpDelete("{id}")]
    public ActionResult<PaymentForm> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }
}