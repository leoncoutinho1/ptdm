using System.Linq.Expressions;
using WebAPI.Models;

namespace WebAPI.Repositories;

public interface ISaleProductRepository : IRepository<SaleProduct>
{
    public IEnumerable<SaleProduct> GetByProductId(Expression<Func<SaleProduct, bool>> predicate);
}