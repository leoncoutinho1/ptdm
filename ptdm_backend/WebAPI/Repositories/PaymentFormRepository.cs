using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class PaymentFormRepository : Repository<PaymentForm>, IPaymentFormRepository
{
    public PaymentFormRepository(AppDbContext context) : base(context) 
    {
        
    }
}