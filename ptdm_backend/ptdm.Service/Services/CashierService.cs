
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

namespace ptdm.Service.Services;

public interface ICashierService
{
    ErrorOr<Cashier> Delete(Guid id);
    ErrorOr<Cashier> Get(Guid id);
    ResultList<Cashier> ListCashier(CashierFilter filters);
    ErrorOr<Cashier> Create(CashierInsertDTO cashier);
    ErrorOr<Cashier> Update(CashierUpdateDTO cashier);
}

public class CashierService : ICashierService
{
    private readonly AppDbContext _context;

    public CashierService(AppDbContext context)
    {
        _context = context;
    }

    public ResultList<Cashier> ListCashier(CashierFilter filters)
    {
        var cashier = _context.Cashiers.Filter(filters).Sort(filters).AsNoTracking();
        var count = cashier.Count();

        return new ResultList<Cashier>(cashier.Paginate(filters).ToList(), count);
    }

    public ErrorOr<Cashier> Get(Guid id)
    {
        var filters = new CashierFilter();
        filters.Id = id;
        var cashier = _context.Cashiers.Apply(filters).AsNoTracking().SingleOrDefault();
        return (cashier != null) ? cashier : Error.NotFound(description: "Cashier not found");
    }

    public ErrorOr<Cashier> Create(CashierInsertDTO dto)
    {
        Cashier cashier = new Cashier()
        {
            Name = dto.Name
        };
        try
        {
            _context.Cashiers.Add(cashier);
            _context.SaveChanges();
            return cashier;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "Cashier can't be created");
        }
    }

    public ErrorOr<Cashier> Update(CashierUpdateDTO dto)
    {
        try
        {
            var cashier = (Cashier)dto;
            _context.Cashiers.Update(cashier);
            _context.SaveChanges();
            return cashier;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "Cashier can't be updated");
        }
    }

    public ErrorOr<Cashier> Delete(Guid id)
    {
        var cashier = _context.Cashiers.SingleOrDefault(p => p.Id == id);
        if (cashier == null)
        {
            return Error.NotFound("Cashier not found");
        }

        try
        {
            _context.Cashiers.Remove(cashier);
            _context.SaveChanges();
            return cashier;
        }
        catch (Exception ex)
        {
            return Error.Failure(description: "Cashier can't be removed");
        }
    }
}