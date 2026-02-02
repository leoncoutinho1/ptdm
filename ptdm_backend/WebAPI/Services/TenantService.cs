using ptdm.Api.Services;

namespace ptdm.Api.Services
{
    public class TenantService : ITenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _configuration;

        public TenantService(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
        {
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
        }

        public string GetConnectionString()
        {
            var httpContext = _httpContextAccessor.HttpContext;

            if (httpContext == null)
            {
                return _configuration.GetConnectionString("DefaultConnection");
            }

            // Validar se o tenant foi extraído pelo Middleware (armazenado em Items ou PathBase)
            // Ou tentar extrair manualmente se o middleware não estiver em uso
            string tenant = null;
            if (httpContext.Items.TryGetValue("Tenant", out var tenantObj) && tenantObj is string t)
            {
                tenant = t;
            }

            if (!string.IsNullOrEmpty(tenant))
            {
                var defaultConnectionString = _configuration.GetConnectionString("DefaultConnection");
                var builder = new Npgsql.NpgsqlConnectionStringBuilder(defaultConnectionString)
                {
                    Database = tenant
                };
                return builder.ConnectionString;
            }

            return _configuration.GetConnectionString("DefaultConnection");
        }
    }
}
