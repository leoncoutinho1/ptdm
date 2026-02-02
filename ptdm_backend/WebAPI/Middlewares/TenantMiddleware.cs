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

            if (!string.IsNullOrEmpty(tenant))
            {
                context.Items["Tenant"] = tenant;
            }

            await _next(context);
        }
    }
}
