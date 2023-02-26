using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class CheckoutRepository : Repository<Checkout>, ICheckoutRepository
{
    public CheckoutRepository(AppDbContext ctx) : base(ctx)
    {
    }
}