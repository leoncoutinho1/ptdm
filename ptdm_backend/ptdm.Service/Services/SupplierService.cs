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
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ptdm.Service.Services
{
    public interface ISupplierService
    {
        ErrorOr<SupplierDTO> Create(SupplierInsertDTO supplier);
        ErrorOr<SupplierDTO> Delete(Guid id);
        ErrorOr<SupplierDTO> Get(Guid id);
        ResultList<SupplierDTO> ListSupplier(SupplierFilter filters);
        ErrorOr<SupplierDTO> Update(SupplierUpdateDTO supplier);
    }

    public class SupplierService : ISupplierService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public SupplierService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetUserId()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
        }

        public ResultList<SupplierDTO> ListSupplier(SupplierFilter filters)
        {
            var suppliers = _context.Suppliers.Filter(filters).Sort(filters).AsNoTracking();
            var count = suppliers.Count();

            return new ResultList<SupplierDTO>(suppliers.Paginate(filters).Select(x => (SupplierDTO)x).ToList(), count);
        }

        public ErrorOr<SupplierDTO> Get(Guid id)
        {
            var supplier = _context.Suppliers.AsNoTracking().FirstOrDefault(x => x.Id == id);
            return (supplier != null) ? (SupplierDTO)supplier : Error.NotFound(description: "Supplier not found");
        }

        public ErrorOr<SupplierDTO> Create(SupplierInsertDTO supplierDto)
        {
            Supplier supplier = new Supplier
            {
                Description = supplierDto.Description,
                CreatedBy = GetUserId(),
                UpdatedBy = GetUserId()
            };

            try
            {
                _context.Suppliers.Add(supplier);
                _context.SaveChanges();
                return (SupplierDTO)supplier;
            }
            catch (Exception)
            {
                return Error.Failure(description: "Supplier can't be created");
            }
        }

        public ErrorOr<SupplierDTO> Update(SupplierUpdateDTO supplierDto)
        {
            var supplier = _context.Suppliers.FirstOrDefault(x => x.Id == supplierDto.Id);
            if (supplier == null) return Error.NotFound();

            supplier.Description = supplierDto.Description;
            supplier.UpdatedBy = GetUserId();
            supplier.UpdatedAt = DateTime.UtcNow;

            try
            {
                _context.Suppliers.Update(supplier);
                _context.SaveChanges();
                return (SupplierDTO)supplier;
            }
            catch (Exception)
            {
                return Error.Failure(description: "Supplier can't be updated");
            }
        }

        public ErrorOr<SupplierDTO> Delete(Guid id)
        {
            var supplier = _context.Suppliers.FirstOrDefault(x => x.Id == id);
            if (supplier == null) return Error.NotFound();

            try
            {
                _context.Suppliers.Remove(supplier);
                _context.SaveChanges();
                return (SupplierDTO)supplier;
            }
            catch (Exception)
            {
                return Error.Failure(description: "Supplier can't be deleted. It might be in use.");
            }
        }
    }
}
