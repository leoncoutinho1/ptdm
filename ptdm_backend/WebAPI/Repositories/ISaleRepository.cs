using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using WebAPI.Models;

namespace WebAPI.Repositories;

public interface ISaleRepository : IRepository<Sale>
{
    public IEnumerable<Sale> ListSalesByParams(Expression<Func<Sale, bool>> predicate);
}