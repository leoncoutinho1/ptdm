using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class BarcodeRepository : Repository<Barcode>, IBarcodeRepository
{
    public BarcodeRepository(AppDbContext ctx) : base(ctx)
    {
    }
}