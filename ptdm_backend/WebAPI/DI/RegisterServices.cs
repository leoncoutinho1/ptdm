using ptdm.Service.Services;

namespace ptdm.Api.DI
{
    public static class RegisterServices
    {
        public static void RegisterEntitiesServices(this IServiceCollection services)
        {
            services.AddScoped<ICashierService, CashierService>();
            services.AddScoped<ICheckoutService, CheckoutService>();
            services.AddScoped<IPaymentFormService, PaymentFormService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<ISaleService, SaleService>();
            services.AddScoped<ICategoryService, CategoryService>();
        }
    }
}
