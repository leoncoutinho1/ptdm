using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class SaleProductRepository : Repository<SaleProduct>, ISaleProductRepository
{
    public SaleProductRepository(AppDbContext context) : base(context) 
    {
        
    }

    public IEnumerable<SaleProduct> GetByProductId(Expression<Func<SaleProduct, bool>> predicate)
    {
        return Get().Where(predicate).Include(sp => sp.ProductId).ToList();
    }
}