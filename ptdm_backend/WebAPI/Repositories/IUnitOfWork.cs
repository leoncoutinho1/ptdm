namespace WebAPI.Repositories;

public interface IUnitOfWork
{
     IProductRepository ProductRepository { get; }
     ISaleRepository SaleRepository { get; }
     ISaleProductRepository SaleProductRepository { get; }
     IPaymentFormRepository PaymentFormRepository { get; }
     ICashierRepository CashierRepository { get; }
     ICheckoutRepository CheckoutRepository { get; }
     IBarcodeRepository BarcodeRepository { get; }

    void Commit();

}