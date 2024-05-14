using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using WebAPI.DTOs;
using WebAPI.Models;
using WebAPI.Repositories;
using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions;
using WebAPI.Filters;
using AspNetCore.IQueryable.Extensions.Sort;
using AspNetCore.IQueryable.Extensions.Pagination;
using Microsoft.AspNetCore.Authorization;

namespace WebAPI.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[AllowAnonymous]
public class SaleController : ControllerBase
{
    private readonly IUnitOfWork _uof;
    private readonly IMapper _mapper;

    public SaleController(IUnitOfWork uof, IMapper mapper)
    {
        _uof = uof;
        _mapper = mapper;
    }

    [HttpGet("ListSale")]
    public ActionResult<IEnumerable<Sale>> ListSale([FromQuery] SaleFilter filters)
    {
        var sales = _uof.SaleRepository.Get()
            .Filter(filters).Sort(filters)
            .Include(x => x.Cashier)
            .Include(x => x.Checkout)
            .Include(x => x.PaymentForm)
            .Include(x => x.SaleProducts)
            .ThenInclude(x => x.Product);

        var count = sales.Count();

        return Ok(new
        {
            data = sales.Paginate(filters),
            count = count
        });
    }

    [HttpGet("ListSaleDTO")]
    public ActionResult<IEnumerable<SaleDTO>> ListSaleDTO([FromQuery] SaleFilter filters)
    {
        var sales = _uof.SaleRepository.Get().Filter(filters).Sort(filters);
        var count = sales.Count();

        var salesDTO = _mapper.Map<List<SaleDTO>>(sales.Paginate(filters));
        return Ok(new
        {
            data = salesDTO,
            count = count
        });
    }

    [HttpGet("{id}", Name = "GetSaleById")]
    public ActionResult<Sale> Get(Guid id)
    {
        var filters = new SaleFilter();
        filters.Id = id;
        var sale = _uof.SaleRepository.Get().Apply(filters).SingleOrDefault();
        return sale != null ? sale : NotFound();
    }

    /// <summary>
    /// Cadastra a venda
    /// </summary>
    /// <remarks>
    /// Exemplo de request:
    ///     
    ///     POST /Sale
    ///     {
    ///         "checkoutId": "",
    ///         "cashierId": "",
    ///         "totalValue": 0,
    ///         "overallDiscount": 0
    ///         "paymentFormId": "",
    ///         "saleProducts": [
    ///             {
    ///                 "productId":"",
    ///                 "quantity": 0,
    ///                 "dicount": 0
    ///             }
    ///         ]
    ///     }
    /// </remarks>
    /// <returns>O container que foi criado contendo a imagem ou video</returns>
    /// <exception cref="Exception"></exception>
    /// <response code="200">Container criado com sucesso</response>
    /// <response code="400">Erro na comunicação com a GraphAPI para carregar a imagem ou video no container</response>
    /// <response code="500">Erro interno na API do facebook, verificar logs para mais detalhes</response>
    [HttpPost]
    public ActionResult Post([FromBody] SaleDTO saleDto)
    {
        Sale sale = _mapper.Map<Sale>(saleDto);
        _uof.SaleRepository.Add(sale);
        
        foreach (var sp in sale.SaleProducts)
        {
            _uof.SaleProductRepository.Add(sp);
            var product = _uof.ProductRepository.Get().Where(x => x.Id == sp.ProductId).SingleOrDefault();
            product.Quantity -= sp.Quantity;
            _uof.ProductRepository.Update(product);    
        }
        
        _uof.Commit();

        return new CreatedAtRouteResult("GetSaleById",
            new { id = sale.Id }, sale);
    }
    
    [HttpPut("{id}")]
    public ActionResult Put(Guid id, Sale sale)
    {
        if (id != sale.Id)
        {
            return BadRequest();
        }
        _uof.SaleRepository.Update(sale);
        _uof.Commit();
        return Ok();
    }

    [HttpDelete("{id}")]
    public ActionResult<Sale> Delete(Guid id)
    {
        var sale = _uof.SaleRepository.Get().Include(x => x.SaleProducts).Where(p => p.Id == id).SingleOrDefault();
        if (sale is null)
            return NotFound();

        foreach(var sale_product in sale.SaleProducts)
        {
            var product = _uof.ProductRepository.Get().SingleOrDefault(x => x.Id == sale_product.ProductId);
            if (product is null)
                continue;
            product.Quantity += sale_product.Quantity;
            _uof.SaleProductRepository.Delete(sale_product);
        }
        
        _uof.SaleRepository.Delete(sale);
        _uof.Commit();
        return sale;
    }    
}