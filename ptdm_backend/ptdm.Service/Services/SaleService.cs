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
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace ptdm.Service.Services
{
    public interface ISaleService
    {
        ErrorOr<SaleDTO> Create(SaleDTO sale);
        ErrorOr<SaleDTO> Delete(Guid id);
        ErrorOr<SaleDTO> Get(Guid id);
        ResultList<SaleDTO> ListSale(SaleFilter filters);
    }

    public class SaleService : ISaleService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public SaleService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetUserId()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
        }

        public ErrorOr<SaleDTO> Create(SaleDTO dto)
        {
            Sale sale = new Sale
            {
                CashierId = dto.CashierId,
                CheckoutId = dto.CheckoutId,
                OverallDiscount = dto.OverallDiscount,
                ChangeValue = dto.ChangeValue,
                PaidValue = dto.PaidValue,
                PaymentFormId = dto.PaymentFormId,
                TotalValue = dto.TotalValue,
                CreatedBy = GetUserId(),
                UpdatedBy = GetUserId()
            };
            _context.Sales.Add(sale);

            _context.SaveChanges();

            foreach (var sp in dto.SaleProducts)
            {
                _context.SaleProducts.Add(new SaleProduct
                {
                    ProductId = sp.ProductId,
                    UnitPrice = sp.UnitPrice,
                    Quantity = sp.Quantity,
                    Discount = sp.Discount,
                    SaleId = sale.Id
                });

                var product = _context.Products.Where(x => x.Id == sp.ProductId).Include(x => x.Barcodes).SingleOrDefault();
                product.Quantity -= sp.Quantity;
                product.UpdatedBy = GetUserId();
                product.UpdatedAt = DateTime.UtcNow;
                _context.Products.Update(product);
            }

            _context.SaveChanges();
            
            return (SaleDTO)sale;
        }

        public ErrorOr<SaleDTO> Delete(Guid id)
        {
            var sale = _context.Sales.FirstOrDefault(p => p.Id == id);
            if (sale is null)
                return Error.NotFound();

            foreach (var sale_product in sale.SaleProducts)
            {
                var product = _context.Products.FirstOrDefault(x => x.Id == sale_product.ProductId);
                if (product is null)
                    continue;
                product.Quantity += sale_product.Quantity;
                _context.SaleProducts.Remove(sale_product);
            }

            _context.Sales.Remove(sale);
            _context.SaveChanges();
            return (SaleDTO)sale;
        }

        public ErrorOr<SaleDTO> Get(Guid id)
        {
            var filters = new SaleFilter();
            filters.Id = id;
            var sale = _context.Sales
                .Include(x => x.Cashier)
                .Include(x => x.Checkout)
                .Include(x => x.PaymentForm)
                .Include(x => x.SaleProducts)
                .ThenInclude(x => x.Product)
                .ThenInclude(x => x.Barcodes)
                .AsNoTracking()
                .FirstOrDefault(x => x.Id == id);

            if (sale is null)
                return Error.NotFound();

            return (SaleDTO)sale;
        }

        public ResultList<SaleDTO> ListSale(SaleFilter filters)
        {
            var sales = _context.Sales
            .Filter(filters).Sort(filters)
            .Include(x => x.Cashier)
            .Include(x => x.Checkout)
            .Include(x => x.PaymentForm)
            .Include(x => x.SaleProducts)
            .ThenInclude(x => x.Product)
            .ThenInclude(x => x.Barcodes)
            .AsNoTracking();

            var count = sales.Count();

            return new ResultList<SaleDTO>(sales.Paginate(filters).Select(x => (SaleDTO)x).ToList(), count);
        }
    }
}