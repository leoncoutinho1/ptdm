using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions;
using Microsoft.AspNetCore.Mvc;
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
[Authorize]
public class CheckoutController : ControllerBase
{
    private readonly IUnitOfWork _uof;

    public CheckoutController(IUnitOfWork uof)
    {
        _uof = uof;
    }

    [HttpGet("ListCheckout")]
    public ActionResult<IEnumerable<Checkout>> ListCheckout([FromQuery] CheckoutFilter filters)
    {
        var checkouts = _uof.CheckoutRepository.Get().Filter(filters).Sort(filters);
        var count = checkouts.Count();

        return Ok(new
        {
            data = checkouts.Paginate(filters),
            count = count
        });
    }

    [HttpGet("{id}", Name = "GetCheckoutById")]
    public ActionResult<Checkout> Get(Guid id)
    {
        var filters = new CheckoutFilter();
        filters.Id = id;
        var checkouts = _uof.CheckoutRepository.Get().Apply(filters).SingleOrDefault();
        return checkouts != null ? checkouts : NotFound();
    }

    [HttpPost]
    public ActionResult Post([FromBody] string checkout)
    {
        Checkout c = new Checkout()
        {
            Name = checkout
        };
        _uof.CheckoutRepository.Add(c);
        _uof.Commit();

        return new CreatedAtRouteResult("GetCheckoutById",
            new { id = c.Id }, c);
    }
    
    [HttpPut("{id}")]
    public ActionResult Put(Guid id, Checkout checkout)
    {
        if (id != checkout.Id)
        {
            return BadRequest();
        }
        _uof.CheckoutRepository.Update(checkout);
        _uof.Commit();
        return Ok();
    }

    [HttpDelete("{id}")]
    public ActionResult<Checkout> Delete(Guid id)
    {
        var checkout = _uof.CheckoutRepository.Get().Where(p => p.Id == id).SingleOrDefault(); ;
        if (checkout is null)
            return NotFound();
        
        _uof.CheckoutRepository.Delete(checkout);
        _uof.Commit();
        return checkout;
    }
}