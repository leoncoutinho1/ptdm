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
    public interface IPayableService
    {
        ErrorOr<PayableDTO> Create(PayableInsertDTO payable);
        ErrorOr<PayableDTO> Delete(Guid id);
        ErrorOr<PayableDTO> Get(Guid id);
        ResultList<PayableDTO> ListPayable(PayableFilter filters);
        ErrorOr<PayableDTO> Update(PayableUpdateDTO payable);
    }

    public class PayableService : IPayableService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PayableService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetUserId()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
        }

        public ResultList<PayableDTO> ListPayable(PayableFilter filters)
        {
            var payables = _context.Payables
                .Include(x => x.Supplier)
                .Filter(filters)
                .Sort(filters)
                .AsNoTracking();

            var count = payables.Count();

            return new ResultList<PayableDTO>(
                payables.Paginate(filters).Select(x => (PayableDTO)x).ToList(), 
                count
            );
        }

        public ErrorOr<PayableDTO> Get(Guid id)
        {
            var payable = _context.Payables
                .Include(x => x.Supplier)
                .AsNoTracking()
                .FirstOrDefault(x => x.Id == id);

            return (payable != null) ? (PayableDTO)payable : Error.NotFound(description: "Payable not found");
        }

        public ErrorOr<PayableDTO> Create(PayableInsertDTO payableDto)
        {
            // Verify if Supplier exists
            var supplierExists = _context.Suppliers.Any(s => s.Id == payableDto.SupplierId);
            if (!supplierExists)
            {
                return Error.Validation(description: "Supplier not found");
            }

            Payable payable = new Payable
            {
                SupplierId = payableDto.SupplierId,
                InvoiceDate = payableDto.InvoiceDate,
                DueDate = payableDto.DueDate,
                Value = payableDto.Value,
                Paid = payableDto.Paid,
                Attachment = payableDto.Attachment,
                CreatedBy = GetUserId(),
                UpdatedBy = GetUserId()
            };

            try
            {
                _context.Payables.Add(payable);
                _context.SaveChanges();

                // Fetch with supplier included
                return Get(payable.Id);
            }
            catch (Exception)
            {
                return Error.Failure(description: "Payable can't be created");
            }
        }

        public ErrorOr<PayableDTO> Update(PayableUpdateDTO payableDto)
        {
            var payable = _context.Payables.FirstOrDefault(x => x.Id == payableDto.Id);
            if (payable == null) return Error.NotFound();

            // Verify if Supplier exists
            var supplierExists = _context.Suppliers.Any(s => s.Id == payableDto.SupplierId);
            if (!supplierExists)
            {
                return Error.Validation(description: "Supplier not found");
            }

            payable.SupplierId = payableDto.SupplierId;
            payable.InvoiceDate = payableDto.InvoiceDate;
            payable.DueDate = payableDto.DueDate;
            payable.Value = payableDto.Value;
            payable.Paid = payableDto.Paid;
            payable.Attachment = payableDto.Attachment;
            payable.UpdatedBy = GetUserId();
            payable.UpdatedAt = DateTime.UtcNow;

            try
            {
                _context.Payables.Update(payable);
                _context.SaveChanges();

                return Get(payable.Id);
            }
            catch (Exception)
            {
                return Error.Failure(description: "Payable can't be updated");
            }
        }

        public ErrorOr<PayableDTO> Delete(Guid id)
        {
            var payable = _context.Payables.FirstOrDefault(x => x.Id == id);
            if (payable == null) return Error.NotFound();

            try
            {
                _context.Payables.Remove(payable);
                _context.SaveChanges();
                return (PayableDTO)payable;
            }
            catch (Exception)
            {
                return Error.Failure(description: "Payable can't be deleted");
            }
        }
    }
}
