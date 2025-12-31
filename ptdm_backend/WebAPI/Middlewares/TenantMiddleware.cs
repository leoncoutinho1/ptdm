namespace ptdm.Api.Middlewares
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            string tenant = null;
            var host = context.Request.Host.Host;

            // 1. Try to extract tenant from Subdomain
            // Logic: If host is NOT an IP address and has subdomains.
            if (Uri.CheckHostName(host) != UriHostNameType.IPv4 && Uri.CheckHostName(host) != UriHostNameType.IPv6)
            {
                var parts = host.Split('.');
                
                // Case: ptdm.localhost (2 parts) or ptdm.vps (2 parts)
                // Case: ptdm.domain.com (3 parts)
                // We need to be careful not to treat "domain.com" as tenant "domain".
                // Simple heuristic for this context:
                // If ends with .localhost, .vps, or has >= 3 parts.
                
                if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase) || 
                    host.EndsWith(".vps", StringComparison.OrdinalIgnoreCase) ||
                    parts.Length >= 3)
                {
                     // Take the first part as tenant, unless it's www
                     if (!string.Equals(parts[0], "www", StringComparison.OrdinalIgnoreCase))
                     {
                         tenant = parts[0];
                     }
                }
            }

            if (!string.IsNullOrEmpty(tenant))
            {
                // Found tenant in Subdomain -> Store it
                context.Items["Tenant"] = tenant;
                // Do NOT modify the path (PathBase), as the routing expects standard paths now
            }
            else
            {
                // 2. Fallback: Path-based tenancy
                var path = context.Request.Path.Value;

                if (!string.IsNullOrEmpty(path) && path.Length > 1)
                {
                    var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                    if (segments.Length > 0)
                    {
                        var candidateTenant = segments[0];
                        
                        // Basic filtering to avoid treating "api", "swagger", etc as tenants if they are at root
                        // But in the original code, it blindly took the first segment. 
                        // To preserve back-compat, we apply the logic, but we might want to be smarter.
                        // For now, keeping original behavior but wrapped in else.

                        tenant = candidateTenant;
                        
                        var originalPathBase = context.Request.PathBase;
                        context.Request.PathBase = originalPathBase.Add($"/{tenant}");
                        context.Request.Path = $"/{string.Join('/', segments.Skip(1))}";

                        context.Items["Tenant"] = tenant;
                    }
                }
            }

            await _next(context);
        }
    }
}
