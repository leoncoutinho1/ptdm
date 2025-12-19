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
            var path = context.Request.Path.Value;

            if (!string.IsNullOrEmpty(path) && path.Length > 1)
            {
                var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (segments.Length > 0)
                {
                    var tenant = segments[0];
                    // Adjust PathBase and Path
                    // Assumption: The first segment is the tenant.
                    // New PathBase: /tenant
                    // New Path: /rest/of/path
                    
                    var originalPathBase = context.Request.PathBase;
                    context.Request.PathBase = originalPathBase.Add($"/{tenant}");
                    context.Request.Path = $"/{string.Join('/', segments.Skip(1))}";

                    // Store tenant in Items for easy access if needed, though PathBase is enough
                    context.Items["Tenant"] = tenant;
                }
            }

            await _next(context);
        }
    }
}
