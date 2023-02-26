using WebAPI.Data;
using WebAPI.Models;

namespace WebAPI.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private IProductRepository _productRepository;
    private ISaleProductRepository _saleProductRepository;
    private ISaleRepository _saleRepository;
    private IPaymentFormRepository _paymentFormRepository;
    private ICashierRepository _cashierRepository;
    private ICheckoutRepository _checkoutRepository;
    private IBarcodeRepository _barcodeRepository;
    private readonly AppDbContext _ctx;

    public UnitOfWork(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    public IProductRepository ProductRepository
    {
        get
        {
            return _productRepository ??= new ProductRepository(_ctx);
        }
    }
    
    public ISaleRepository SaleRepository { 
        get
        {
            return _saleRepository ??= new SaleRepository(_ctx);
        }
    }

    public ISaleProductRepository SaleProductRepository
    {
        get
        {
            return _saleProductRepository ??= new SaleProductRepository(_ctx);
        }
    }

    public IPaymentFormRepository PaymentFormRepository
    {
        get
        {
            return _paymentFormRepository ??= new PaymentFormRepository(_ctx);
        }
    }

    public ICashierRepository CashierRepository {
        get
        {
            return _cashierRepository ??= new CashierRepository(_ctx);
        } 
    }

    public ICheckoutRepository CheckoutRepository
    {
        get
        {
            return _checkoutRepository ??= new CheckoutRepository(_ctx);
        }
    }

    public IBarcodeRepository BarcodeRepository
    {
        get
        {
            return _barcodeRepository ??= new BarcodeRepository(_ctx);
        }
    }

    public void Commit()
    {
        _ctx.SaveChanges();
    }

    public void Dispose()
    {
        _ctx.Dispose();
    }
}