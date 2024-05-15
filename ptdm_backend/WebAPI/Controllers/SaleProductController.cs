using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
public class SaleProductController : ControllerBase
{
    private readonly IUnitOfWork _uof;
    private readonly IMapper _mapper;

    public SaleProductController(IUnitOfWork uof, IMapper mapper)
    {
        _uof = uof;
        _mapper = mapper;
    }

    [HttpGet("ListSaleProduct")]
    public ActionResult<IEnumerable<SaleProduct>> ListSaleProduct([FromQuery] SaleProductFilter filters)
    {
        var saleProducts = _uof.SaleProductRepository.Get().Filter(filters).Sort(filters);
        var count = saleProducts.Count();

        return Ok(new
        {
            data = saleProducts.Paginate(filters),
            count = count
        });
    }

    [HttpGet("{id}", Name = "GetSaleProductById")]
    public ActionResult<SaleProduct> Get(Guid id)
    {
        var filters = new SaleProductFilter();
        filters.Id = id;
        var saleProduct = _uof.SaleProductRepository.Get().Apply(filters).SingleOrDefault();
        return saleProduct != null ? saleProduct : NotFound();
    }

    //[HttpPost]
    //public ActionResult Post([FromBody] SaleProduct saleProduct)
    //{
    //    _uof.SaleProductRepository.Add(saleProduct);
    //    _uof.Commit();

    //    return new CreatedAtRouteResult("GetBySaleProductId",
    //        new { id = saleProduct.Id }, saleProduct);
    //}
    
    //[HttpPut("{id}")]
    //public ActionResult Put(Guid id, SaleProduct saleProduct)
    //{
    //    if (id != saleProduct.Id)
    //    {
    //        return BadRequest();
    //    }
    //    _uof.SaleProductRepository.Update(saleProduct);
    //    _uof.Commit();
    //    return Ok();
    //}

    //[HttpDelete("{id}")]
    //public ActionResult<SaleProduct> Delete(Guid id)
    //{
    //    var saleProduct = _uof.SaleProductRepository.Get().Where(p => p.Id == id).SingleOrDefault();
    //    if (saleProduct is null)
    //        return NotFound();
        
    //    _uof.SaleProductRepository.Delete(saleProduct);
    //    _uof.Commit();
    //    return saleProduct;
    //}
}