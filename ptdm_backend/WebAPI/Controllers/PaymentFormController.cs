using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace ptdm.Api.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[Authorize]
public class PaymentFormController : ControllerBase
{
    //private readonly IUnitOfWork _uof;
    //private readonly IMapper _mapper;

    //public PaymentFormController(IUnitOfWork uof, IMapper mapper)
    //{
    //    _uof = uof;
    //    _mapper = mapper;
    //}

    //[HttpGet("ListPaymentForm")]
    //public ActionResult<IEnumerable<PaymentForm>> ListPaymentForm([FromQuery] PaymentFormFilter filters)
    //{
    //    var paymentForms = _uof.PaymentFormRepository.Get().Filter(filters).Sort(filters);
    //    var count = paymentForms.Count();
                
    //    return Ok(new
    //    {
    //        data = paymentForms.Paginate(filters),
    //        count = count
    //    });
    //}

    //[HttpGet("{id}", Name = "GetPaymentFormById")]
    //public ActionResult<PaymentForm> Get(Guid id)
    //{
    //    var filters = new PaymentFormFilter();
    //    filters.Id = id;
    //    var paymentForms = _uof.PaymentFormRepository.Get().Apply(filters).SingleOrDefault();
    //    return paymentForms != null ? paymentForms : NotFound();
    //}

    //[HttpPost]
    //public ActionResult Post([FromBody] string paymentForm)
    //{
    //    PaymentForm pf = new PaymentForm()
    //    {
    //        Description = paymentForm
    //    };
    //    _uof.PaymentFormRepository.Add(pf);
    //    _uof.Commit();

    //    return new CreatedAtRouteResult("GetPaymentFormById",
    //        new { id = pf.Id }, pf);
    //}
    
    //[HttpPut("{id}")]
    //public ActionResult Put(Guid id, PaymentForm paymentForm)
    //{
    //    if (id != paymentForm.Id)
    //    {
    //        return BadRequest();
    //    }
    //    _uof.PaymentFormRepository.Update(paymentForm);
    //    _uof.Commit();
    //    return Ok();
    //}

    //[HttpDelete("{id}")]
    //public ActionResult<PaymentForm> Delete(Guid id)
    //{
    //    var paymentForm = _uof.PaymentFormRepository.Get().Where(p => p.Id == id).SingleOrDefault();
    //    if (paymentForm is null)
    //        return NotFound();
        
    //    _uof.PaymentFormRepository.Delete(paymentForm);
    //    _uof.Commit();
    //    return paymentForm;
    //}
}