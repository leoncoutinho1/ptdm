
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

namespace ptdm.Service.Services;

public interface IPaymentFormService
{
    ErrorOr<PaymentForm> Delete(Guid id);
    ErrorOr<PaymentForm> Get(Guid id);
    ResultList<PaymentForm> ListPaymentForm(PaymentFormFilter filters);
    ErrorOr<PaymentForm> Create(PaymentFormDto dto);
    ErrorOr<PaymentForm> Update(PaymentFormUpdateDTO dto);
}

public class PaymentFormService : IPaymentFormService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PaymentFormService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    private string GetUserId()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
    }

    public ResultList<PaymentForm> ListPaymentForm(PaymentFormFilter filters)
    {
        var paymentForm = _context.PaymentForms.Filter(filters).Sort(filters).AsNoTracking();
        var count = paymentForm.Count();

        return new ResultList<PaymentForm>(paymentForm.Paginate(filters).ToList(), count);
    }

    public ErrorOr<PaymentForm> Get(Guid id)
    {
        var filters = new PaymentFormFilter();
        filters.Id = id;
        var paymentForm = _context.PaymentForms.Apply(filters).AsNoTracking().SingleOrDefault();
        return (paymentForm != null) ? paymentForm : Error.NotFound(description: "PaymentForm not found");
    }

    public ErrorOr<PaymentForm> Create(PaymentFormDto dto)
    {
        PaymentForm paymentForm = new PaymentForm()
        {
            Description = dto.Description,
            CreatedBy = GetUserId(),
            UpdatedBy = GetUserId()
        };
        try
        {
            _context.PaymentForms.Add(paymentForm);
            _context.SaveChanges();
            return paymentForm;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "PaymentForm can't be created");
        }
    }

    public ErrorOr<PaymentForm> Update(PaymentFormUpdateDTO dto)
    {
        var paymentForm = _context.PaymentForms.FirstOrDefault(x => x.Id == dto.Id);

        if (paymentForm == null)
        {
            return Error.NotFound();
        }

        paymentForm.Description = dto.Description;
        paymentForm.UpdatedBy = GetUserId();
        paymentForm.UpdatedAt = DateTime.UtcNow;

        try
        {
            _context.PaymentForms.Update(paymentForm);
            _context.SaveChanges();
            return paymentForm;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "PaymentForm can't be updated");
        }
    }

    public ErrorOr<PaymentForm> Delete(Guid id)
    {
        var paymentForm = _context.PaymentForms.SingleOrDefault(p => p.Id == id);
        if (paymentForm == null)
        {
            return Error.NotFound("PaymentForm not found");
        }

        try
        {
            _context.PaymentForms.Remove(paymentForm);
            _context.SaveChanges();
            return paymentForm;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "PaymentForm can't be removed");
        }
    }
}