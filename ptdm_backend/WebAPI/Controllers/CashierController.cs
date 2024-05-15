using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using WebAPI.Filters;
using WebAPI.Models;
using WebAPI.Repositories;
using AspNetCore.IQueryable.Extensions.Sort;
using AspNetCore.IQueryable.Extensions.Pagination;
using Microsoft.AspNetCore.Authorization;

namespace WebAPI.Controllers;


[Route("[controller]")]
[ApiController]
[AllowAnonymous]
public class CashierController : ControllerBase
{
    private readonly IUnitOfWork _uof;

    public CashierController(IUnitOfWork uof)
    {
        _uof = uof;
    }

    [HttpGet("ListCashier")]
    public ActionResult<IEnumerable<Cashier>> ListCashier([FromQuery] CashierFilter filters)
    {
        var cashier = _uof.CashierRepository.Get().Filter(filters).Sort(filters);
        var count = cashier.Count();

        return Ok(new
        {
            data = cashier.Paginate(filters),
            count = count
        });
    }

    [HttpGet("{id}", Name = "GetCashierById")]
    public ActionResult<Cashier> Get(Guid id)
    {
        var filters = new CashierFilter();
        filters.Id = id;
        var cashier = _uof.CashierRepository.Get().Apply(filters).SingleOrDefault();
        return cashier != null ? cashier : NotFound();
    }

    [HttpPost]
    public ActionResult Post([FromBody] string cashier)
    {
        Cashier c = new Cashier()
        {
            Name = cashier
        };
        _uof.CashierRepository.Add(c);
        _uof.Commit();
        
         return new CreatedAtRouteResult("GetCashierById",
             new { id = c.Id }, c);
    }
    
    [HttpPut("{id}")]
    public ActionResult Put(Guid id, Cashier cashier)
    {
        if (id != cashier.Id)
        {
            return BadRequest();
        }
        _uof.CashierRepository.Update(cashier);
        _uof.Commit();
        return Ok();
    }

    [HttpDelete("{id}")]
    public ActionResult<Cashier> Delete(Guid id)
    {
        var cashier = _uof.CashierRepository.Get().Where(p => p.Id == id).SingleOrDefault(); ;
        if (cashier is null)
            return NotFound();
        
        _uof.CashierRepository.Delete(cashier);
        _uof.Commit();
        return cashier;
    }
}