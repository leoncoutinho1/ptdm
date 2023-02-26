using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class CashierRepository : Repository<Cashier>, ICashierRepository
{
    public CashierRepository(AppDbContext ctx) : base(ctx)
    {
    }
}