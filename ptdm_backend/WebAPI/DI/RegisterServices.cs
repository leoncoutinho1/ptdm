using ptdm.Service.Services;

namespace ptdm.Api.DI
{
    public static class RegisterServices
    {
        public static void RegisterEntitiesServices(this IServiceCollection services)
        {
            services.AddScoped<ICashierService, CashierService>();
        }
    }
}
