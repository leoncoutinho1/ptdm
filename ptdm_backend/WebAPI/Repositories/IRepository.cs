using System.Linq.Expressions;

namespace WebAPI.Repositories;

public interface IRepository<T>
{
    IQueryable<T> Get();
    List<T> List();
    void Add(T entity);
    void Update(T entity);
    void Delete(T entity);
}