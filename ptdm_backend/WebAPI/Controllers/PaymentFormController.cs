
using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using WebAPI.DTOs;
using WebAPI.Filters;
using WebAPI.Models;
using WebAPI.Repositories;
using AspNetCore.IQueryable.Extensions.Sort;
using AspNetCore.IQueryable.Extensions.Pagination;
using Microsoft.AspNetCore.Authorization;

namespace WebAPI.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[AllowAnonymous]
public class PaymentFormController : ControllerBase
{
    private readonly IUnitOfWork _uof;
    private readonly IMapper _mapper;

    public PaymentFormController(IUnitOfWork uof, IMapper mapper)
    {
        _uof = uof;
        _mapper = mapper;
    }

    [HttpGet("ListPaymentForm")]
    public ActionResult<IEnumerable<PaymentForm>> ListPaymentForm([FromQuery] PaymentFormFilter filters)
    {
        var paymentForms = _uof.PaymentFormRepository.Get().Filter(filters).Sort(filters);
        var count = paymentForms.Count();
                
        return Ok(new
        {
            data = paymentForms.Paginate(filters),
            count = count
        });
    }

    [HttpGet("{id}", Name = "GetPaymentFormById")]
    public ActionResult<PaymentForm> Get(Guid id)
    {
        var filters = new PaymentFormFilter();
        filters.Id = id;
        var paymentForms = _uof.PaymentFormRepository.Get().Apply(filters).SingleOrDefault();
        return paymentForms != null ? paymentForms : NotFound();
    }

    [HttpPost]
    public ActionResult Post([FromBody] PaymentForm paymentForm)
    {
        _uof.PaymentFormRepository.Add(paymentForm);
        _uof.Commit();

        return new CreatedAtRouteResult("GetPaymentFormById",
            new { id = paymentForm.Id }, paymentForm);
    }
    
    [HttpPut("{id}")]
    public ActionResult Put(Guid id, PaymentForm paymentForm)
    {
        if (id != paymentForm.Id)
        {
            return BadRequest();
        }
        _uof.PaymentFormRepository.Update(paymentForm);
        _uof.Commit();
        return Ok();
    }

    [HttpDelete("{id}")]
    public ActionResult<PaymentForm> Delete(Guid id)
    {
        var paymentForm = _uof.PaymentFormRepository.Get().Where(p => p.Id == id).SingleOrDefault();
        if (paymentForm is null)
            return NotFound();
        
        _uof.PaymentFormRepository.Delete(paymentForm);
        _uof.Commit();
        return paymentForm;
    }
}