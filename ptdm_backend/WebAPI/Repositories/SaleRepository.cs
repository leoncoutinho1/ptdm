using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class SaleRepository : Repository<Sale>, ISaleRepository
{ 
    public SaleRepository(AppDbContext ctx) : base(ctx)
    {
    }
    
    public IEnumerable<Sale> ListSalesByParams(Expression<Func<Sale, bool>> predicate)
    {
        return Get().Where(predicate)
            .Include(s => s.Cashier)
            .Include(s => s.Checkout)
            .Include(s => s.PaymentForm)
            .Include(s => s.SaleProducts)
            .ThenInclude(sp => sp.Product)
            .ToList();
    }
}