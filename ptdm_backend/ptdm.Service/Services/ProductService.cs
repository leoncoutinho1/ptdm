using AspNetCore.IQueryable.Extensions;
using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions.Pagination;
using AspNetCore.IQueryable.Extensions.Sort;
using ErrorOr;
using Microsoft.EntityFrameworkCore;
using ptdm.Data.Context;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ptdm.Service.Services
{
    public interface IProductService
    {
        ErrorOr<ProductDTO> Create(ProductDTO product);
        ErrorOr<ProductDTO> Delete(Guid id);
        ErrorOr<ProductDTO> Get(Guid id);
        ResultList<ProductDTO> GetProductByDescOrBarcode(string text);
        ResultList<ProductDTO> ListProduct(ProductFilter filters);
        ErrorOr<ProductDTO> Update(ProductDTO product);
    }

    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        public ResultList<ProductDTO> GetProductByDescOrBarcode(string text)
        {
            if (String.IsNullOrWhiteSpace(text))
                return new ResultList<ProductDTO>(Array.Empty<ProductDTO>(), 0);
                
            var products = _context.Products
                .Where(x => x.Barcodes.Any(barcode => barcode.Code == text) || x.Description.ToUpper().Contains(text.ToUpper()))
                .Include(x => x.Barcodes)
                .AsNoTracking();

            if (products.Count() == 0)
                return new ResultList<ProductDTO>(Array.Empty<ProductDTO>(), 0);

            var count = products.Count();

            return new ResultList<ProductDTO>(products.Select(x => (ProductDTO)x).ToList(), count);
        }

        public ResultList<ProductDTO> ListProduct(ProductFilter filters)
        {
            var products = _context.Products.Filter(filters).Sort(filters).Include(x => x.Barcodes).AsNoTracking();
            var count = products.Count();

            return new ResultList<ProductDTO>(products.Paginate(filters).Select(x => (ProductDTO)x).ToList(), count);
        }

        public ErrorOr<ProductDTO> Get(Guid id)
        {
            var filters = new ProductFilter();
            filters.Id = id;
            var products = _context.Products.Apply(filters).Include(x => x.Barcodes).AsNoTracking().SingleOrDefault();
            return (products != null) ? (ProductDTO)products : Error.NotFound(description: "Product not found");
        }

        public ErrorOr<ProductDTO> Create(ProductDTO product)
        {
            if (!product.Barcodes.Any())
                return Error.Failure("É necessário informar ao menos um código.");

            var existCodes = _context.Barcodes.Where(x => product.Barcodes.Contains(x.Code)).AsNoTracking().ToList();
            if (product.Barcodes.Count == existCodes.Count)
                return Error.Failure("O código informado já existe para outro produto");

            Product p = new Product
            {
                Description = product.Description,
                Cost = product.Cost,
                ProfitMargin = product.Cost * 100 / product.Price,
                Price = product.Price,
                Quantity = product.Quantity
            };

            try
            {
                _context.Products.Add(p);
                _context.SaveChanges();

                foreach (var barcode in product.Barcodes)
                {
                    if (!existCodes.Any(x => x.Code == barcode))
                        _context.Barcodes.Add(new Barcode
                        {
                            ProductId = p.Id,
                            Code = barcode
                        });
                }
                _context.SaveChanges();
                return (ProductDTO)p;

            }
            catch (Exception ex)
            {
                return Error.Failure(description: "Product can't be created");
            }
        }

        public ErrorOr<ProductDTO> Update(ProductDTO product)
        {
            if (!product.Barcodes.Any())
                return Error.Failure("É necessário informar ao menos um código");

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

            var codes = _context.Barcodes.Where(x => product.Barcodes.Contains(x.Code) || x.ProductId == product.Id);
            var existCode = 0;
            var otherProduct = 0;

            var removedCodes = codes.Where(x => x.ProductId == product.Id && !product.Barcodes.Contains(x.Code));
            foreach (var code in removedCodes)
            {
                _context.Barcodes.Remove(code);
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

            foreach (var c in product.Barcodes)
            {
                _context.Add(new Barcode
                {
                    Code = c,
                    ProductId = product.Id
                });
                existCode++;
            }

            if (existCode == 0)
                if (otherProduct > 0)
                    return Error.Failure("O código que você tentou inserir já existe para outro produto");
                else
                    return Error.Failure("O Produto não possui um código");

            _context.Products.Update(p);
            _context.SaveChanges();
            return (ProductDTO)p;
        }

        public ErrorOr<ProductDTO> Delete(Guid id)
        {
            var product = _context.Products.Where(p => p.Id == id).SingleOrDefault();

            if (product is null)
                return Error.NotFound();

            foreach (var code in product.Barcodes)
            {
                _context.Barcodes.Remove(code);
            }

            _context.Products.Remove(product);
            _context.SaveChanges();
            return (ProductDTO)product;
        }

        //[HttpPost("loadProducts")]
        //public ActionResult LoadProducts([Required] IFormFile file)
        //{
        //    using (var reader = new StreamReader(file.OpenReadStream()))
        //    {
        //        var count = 0;
        //        reader.ReadLine(); // pular o cabeçalho da planilha
        //        while (!reader.EndOfStream) {
        //            var line = reader.ReadLine().Split('\t');
        //            if (line == null || line.Length == 0)
        //                break;

        //            var product = new Product();
        //            product.Description = line[0];
        //            product.Cost = Double.Parse(line[1]);
        //            product.Price = Double.Parse(line[2]);
        //            product.Quantity = Double.Parse(line[3]);

        //            _uof.ProductRepository.Add(product);

        //            if (line.Length > 4)
        //            {
        //                for(var i = 4; i < line.Length; i++)
        //                {
        //                    if (String.IsNullOrWhiteSpace(line[i]))
        //                        continue;

        //                    var barcode = new Barcode()
        //                    {
        //                        Code = line[i],
        //                        ProductId = product.Id
        //                    };

        //                    _uof.BarcodeRepository.Add(barcode);
        //                }
        //            }
        //        }
        //        _uof.Commit();
        //    }
        //    return Ok();
        //}
    }
}
