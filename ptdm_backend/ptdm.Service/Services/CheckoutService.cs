
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

public interface ICheckoutService
{
    ErrorOr<Checkout> Delete(Guid id);
    ErrorOr<Checkout> Get(Guid id);
    ResultList<Checkout> ListCheckout(CheckoutFilter filters);
    ErrorOr<Checkout> Create(CheckoutInsertDTO dto);
    ErrorOr<Checkout> Update(CheckoutUpdateDTO dto);
}

public class CheckoutService : ICheckoutService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CheckoutService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    private string GetUserId()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
    }

    public ResultList<Checkout> ListCheckout(CheckoutFilter filters)
    {
        var checkout = _context.Checkouts.Filter(filters).Sort(filters).AsNoTracking();
        var count = checkout.Count();

        return new ResultList<Checkout>(checkout.Paginate(filters).ToList(), count);
    }

    public ErrorOr<Checkout> Get(Guid id)
    {
        var filters = new CheckoutFilter();
        filters.Id = id;
        var checkout = _context.Checkouts.Apply(filters).AsNoTracking().SingleOrDefault();
        return (checkout != null) ? checkout : Error.NotFound(description: "Checkout not found");
    }

    public ErrorOr<Checkout> Create(CheckoutInsertDTO dto)
    {
        Checkout checkout = new Checkout()
        {
            Name = dto.Name,
            CreatedBy = GetUserId()
        };
        try
        {
            _context.Checkouts.Add(checkout);
            _context.SaveChanges();
            return checkout;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "Checkout can't be created");
        }
    }

    public ErrorOr<Checkout> Update(CheckoutUpdateDTO dto)
    {
        try
        {
            var checkout = _context.Checkouts.FirstOrDefault(x => x.Id == dto.Id);
            if (checkout == null) return Error.NotFound(description: "Checkout not found");

            checkout.Name = dto.Name;
            checkout.UpdatedBy = GetUserId();
            checkout.UpdatedAt = DateTime.UtcNow;

            _context.Checkouts.Update(checkout);
            _context.SaveChanges();
            return checkout;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "Checkout can't be updated");
        }
    }

    public ErrorOr<Checkout> Delete(Guid id)
    {
        var checkout = _context.Checkouts.SingleOrDefault(p => p.Id == id);
        if (checkout == null)
        {
            return Error.NotFound("Checkout not found");
        }

        try
        {
            _context.Checkouts.Remove(checkout);
            _context.SaveChanges();
            return checkout;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "Checkout can't be removed");
        }
    }
}