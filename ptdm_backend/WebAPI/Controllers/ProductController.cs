using AspNetCore.IQueryable.Extensions;
using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions.Pagination;
using AspNetCore.IQueryable.Extensions.Sort;
using AutoMapper;
using CsvHelper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using WebAPI.DTOs;
using WebAPI.Filters;
using WebAPI.Models;
using WebAPI.Repositories;
using static Microsoft.AspNetCore.Http.Results;

namespace WebAPI.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[AllowAnonymous]
public class ProductController : ControllerBase
{
    private readonly IUnitOfWork _uof;
    private readonly IMapper _mapper;

    public ProductController(IUnitOfWork uof, IMapper mapper)
    {
        _uof = uof;
        _mapper = mapper;
    }

    [HttpGet("GetProductByBarcode")]
    public ActionResult<ProductDTO> GetProductByBarcode([FromQuery] string barcode)
    {
        if (String.IsNullOrWhiteSpace(barcode))
            return BadRequest();

        var product = _uof.ProductRepository.Get().Include(x => x.Barcodes).Where(x => x.Barcodes.Contains(new Barcode { Code = barcode })).SingleOrDefault();
        
        if (product == null)
            return NotFound();

        var productDTO = new ProductDTO
        {
            Id = product.Id,
            Description = product.Description,
            Cost = product.Cost,
            Price = product.Price,
            Quantity = product.Quantity,
            CreatedAt = product.CreatedAt,
            Barcodes = product.Barcodes.Select(x => x.Code).ToList()
        };

        return Ok(productDTO);
    }

    [HttpGet("ListProduct")]
    public ActionResult<IEnumerable<Product>> ListProduct([FromQuery] ProductFilter filters)
    {
        var products = _uof.ProductRepository.Get().Include(x => x.Barcodes).Filter(filters).Sort(filters);
        var count = products.Count();

        var prods = products.Paginate(filters);
        var productsDTO = new List<ProductDTO>();

        foreach(var p in prods)
        {
            productsDTO.Add(new ProductDTO
            {
                Id = p.Id,
                Description = p.Description,
                Cost = p.Cost,
                ProfitMargin = p.ProfitMargin,
                Price = p.Price,
                Quantity = p.Quantity,
                CreatedAt = p.CreatedAt,
                Barcodes = p.Barcodes.Select(x => x.Code).ToList()
            });
        }

        return Ok(new
        {
            data = productsDTO,
            count = count
        });
    }
    
    [HttpGet("{id}", Name = "GetProductById")]
    public ActionResult<ProductDTO> Get(Guid id)
    {
        var filters = new ProductFilter();
        filters.Id = id;
        var product = _uof.ProductRepository.Get().Include(x => x.Barcodes).Apply(filters).SingleOrDefault();
        if (product == null)
            return NotFound();

        var productDTO = new ProductDTO
        {
            Id = product.Id,
            Description = product.Description,
            Cost = product.Cost,
            Price = product.Price,
            Quantity = product.Quantity,
            CreatedAt = product.CreatedAt,
            Barcodes = product.Barcodes.Select(x => x.Code).ToList()
        };
        
        return productDTO;
    }

    [HttpPost]
    public ActionResult Post([FromBody] ProductDTO product)
    {
        if (!product.Barcodes.Any())
            return BadRequest(new { message = "É necessário informar ao menos um código." });
            

        var existCodes = _uof.BarcodeRepository.Get().Where(x => product.Barcodes.Contains(x.Code)).ToList();
        if (product.Barcodes.Count == existCodes.Count)
            return BadRequest(new { message = "O código informado já existe para outro produto" });

        Product p = new Product
        {
            Description = product.Description,
            Cost = product.Cost,
            ProfitMargin = product.Cost * 100 / product.Price,
            Price = product.Price,
            Quantity = product.Quantity
        };

        _uof.ProductRepository.Add(p);
        _uof.Commit();

        foreach (var barcode in product.Barcodes)
        {
            if (!existCodes.Any(x => x.Code == barcode))
                _uof.BarcodeRepository.Add(new Barcode
                {
                    ProductId = p.Id,
                    Code = barcode
                });
        }

        _uof.Commit();

        return new CreatedAtRouteResult("GetProductById",
            new { id = p.Id }, p);
    }
    
    [HttpPut("{id}")]
    public ActionResult Put(Guid id, ProductDTO product)
    {
        if (id != product.Id)
            return BadRequest(new { message = "Não foi informado o id do produto" });
        
        if (!product.Barcodes.Any())
            return BadRequest(new { message = "É necessário informar ao menos um código" });

        Product p = new Product
        {
            Id = product.Id,
            Description = product.Description,
            Cost = product.Cost,
            ProfitMargin = product.ProfitMargin,
            Price = product.Price,
            Quantity = product.Quantity,
            CreatedAt = product.CreatedAt
        };

        var codes = _uof.BarcodeRepository.Get().Where(x => product.Barcodes.Contains(x.Code) || x.ProductId == product.Id);
        var existCode = 0;
        var otherProduct = 0;

        var removedCodes = codes.Where(x => x.ProductId == product.Id && !product.Barcodes.Contains(x.Code));
        foreach (var code in removedCodes)
        {
            _uof.BarcodeRepository.Delete(code);
        }

        foreach (var c in codes)
        {
            if (product.Barcodes.Contains(c.Code))
            {
                product.Barcodes.Remove(c.Code);
                if (c.ProductId == product.Id)
                    existCode++;
                else
                    otherProduct++;
            }
        }
                                
        foreach(var c in product.Barcodes)
        {
            _uof.BarcodeRepository.Add(new Barcode
            {
                Code = c,
                ProductId = product.Id
            });
            existCode++;
        }

        if (existCode == 0)
            if (otherProduct > 0)
                return BadRequest(new { message = "O código que você tentou inserir já existe para outro produto" });
            else
                return BadRequest(new { message = "O Produto não possui um código" });

        _uof.ProductRepository.Update(p);
        _uof.Commit();
        return Ok();
    }

    [HttpDelete("{id}")]
    public ActionResult<Product> Delete(Guid id)
    {
        var product = _uof.ProductRepository.Get().Include(x => x.Barcodes).Where(p => p.Id == id).SingleOrDefault();
        foreach(var code in product.Barcodes)
        {
            _uof.BarcodeRepository.Delete(code);
        }
        if (product is null)
            return NotFound();
        
        _uof.ProductRepository.Delete(product);
        _uof.Commit();
        return product;
    }

    [HttpPost("loadProducts")]
    public ActionResult LoadProducts([Required] IFormFile file)
    {
        using (var reader = new StreamReader(file.OpenReadStream()))
        {
            var count = 0;
            reader.ReadLine(); // pular o cabeçalho da planilha
            while (!reader.EndOfStream) {
                var line = reader.ReadLine().Split('\t');
                if (line == null || line.Length == 0)
                    break;

                var product = new Product();
                product.Description = line[0];
                product.Cost = Double.Parse(line[1]);
                product.Price = Double.Parse(line[2]);
                product.Quantity = Double.Parse(line[3]);

                _uof.ProductRepository.Add(product);

                if (line.Length > 4)
                {
                    for(var i = 4; i < line.Length; i++)
                    {
                        if (String.IsNullOrWhiteSpace(line[i]))
                            continue;

                        var barcode = new Barcode()
                        {
                            Code = line[i],
                            ProductId = product.Id
                        };

                        _uof.BarcodeRepository.Add(barcode);
                    }
                }
            }
            _uof.Commit();
        }
        return Ok();
    }
}