using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using WebAPI.Data;

namespace WebAPI.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    private readonly AppDbContext _ctx;

    public Repository(AppDbContext ctx)
    {
        _ctx = ctx;
    }
    
    public IQueryable<T> Get()
    {
        return _ctx.Set<T>();
    }

    public List<T> List()
    {
        return _ctx.Set<T>().AsNoTracking().ToList();
    }

    void IRepository<T>.Add(T entity)
    {
        _ctx.Set<T>().Add(entity);
    }

    void IRepository<T>.Update(T entity)
    {
        _ctx.Entry(entity).State = EntityState.Modified;
        _ctx.Set<T>().Update(entity);
    }

    public void Delete(T entity)
    {
        _ctx.Set<T>().Remove(entity);
    }
}