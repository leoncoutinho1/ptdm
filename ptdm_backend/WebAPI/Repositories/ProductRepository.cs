using System.Linq.Expressions;
using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(AppDbContext context) : base(context) 
    {
        
    }
}