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

            // 1. Try to extract tenant from Authorization header (JWT Token)
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                
                if (handler.CanReadToken(token))
                {
                    var jwtToken = handler.ReadJwtToken(token);
                    tenant = jwtToken.Claims.FirstOrDefault(c => c.Type == "tenant")?.Value;
                }
            }

            // 2. Try to extract tenant from request body for login/register
            if (string.IsNullOrEmpty(tenant) && context.Request.HasJsonContentType() && context.Request.ContentLength > 0 &&
                (context.Request.Path.Value?.EndsWith("authenticate", StringComparison.OrdinalIgnoreCase) == true ||
                 context.Request.Path.Value?.EndsWith("register", StringComparison.OrdinalIgnoreCase) == true))
            {
                context.Request.EnableBuffering();
                using (var reader = new System.IO.StreamReader(context.Request.Body, System.Text.Encoding.UTF8, leaveOpen: true))
                {
                    var body = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;

                    try
                    {
                        var jsonDoc = System.Text.Json.JsonDocument.Parse(body);
                        var tenantProp = jsonDoc.RootElement.EnumerateObject()
                            .FirstOrDefault(p => string.Equals(p.Name, "tenant", StringComparison.OrdinalIgnoreCase));
                            
                        if (tenantProp.Value.ValueKind != System.Text.Json.JsonValueKind.Undefined)
                        {
                            tenant = tenantProp.Value.GetString();
                        }
                    }
                    catch { } // Ignore parsing errors
                }
            }

            if (!string.IsNullOrEmpty(tenant))
            {
                context.Items["Tenant"] = tenant;
            }

            await _next(context);
        }
    }
}
