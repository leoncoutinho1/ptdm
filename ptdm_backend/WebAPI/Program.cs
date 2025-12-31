using System.Reflection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ptdm.Data.Context;
using ptdm.Api.DI;
using ptdm.Api.Services;
using ptdm.Api.Middlewares;
using ptdm.Domain.Models;

Console.WriteLine("App started");

try
{
    var builder = WebApplication.CreateBuilder(args);
    var config = builder.Configuration;
    

    builder.Services.AddScoped<ITenantService, TenantService>();

    builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
    {
        var tenantService = serviceProvider.GetRequiredService<ITenantService>();
        var connectionString = tenantService.GetConnectionString();
        options.UseNpgsql(connectionString);
    });

    builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

    builder.Services.RegisterEntitiesServices();

    builder.Services.AddControllers();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "API PDV", Version = "v1" });
        var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
             Description = "Standard Authorization header using the Bearer scheme. Example: \"bearer {token}\"",
             In = ParameterLocation.Header,
             Name = "Authorization",
             Type = SecuritySchemeType.ApiKey,
             Scheme = "Bearer"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement()
      {
        {
          new OpenApiSecurityScheme
          {
            Reference = new OpenApiReference
              {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
              },
              Scheme = "oauth2",
              Name = "Bearer",
              In = ParameterLocation.Header,

            },
            new List<string>()
          }
        });
    });
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(
            policy =>
            {
                policy.WithOrigins(Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "*").AllowAnyMethod().AllowAnyHeader();
            });
    });

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    // Adding Jwt Bearer
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidAudience = config["JWT:ValidAudience"],
            ValidIssuer = config["JWT:ValidIssuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JWT:SecurityKey"]))
        };
    });

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddHealthChecks();
        
    if (builder.Environment.IsProduction())
    {
        var portVar = Environment.GetEnvironmentVariable("PORT");
        if (portVar is { Length: > 0 } && int.TryParse(portVar, out var port))
        {
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.ListenAnyIP(port);
            });
        }
    }
    
    var app = builder.Build();

    app.UseCors();

    app.UseMiddleware<TenantMiddleware>();
    // Explicitly add UseRouting so it runs AFTER TenantMiddleware
    app.UseRouting();

    app.MapControllers();
    if (!builder.Environment.IsProduction())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    app.MapHealthChecks("/healthcheck");
    app.MapHealthChecks("/healthchecks");

    // app.UseMiddleware<TenantMiddleware>(); // Moved up
    app.UseAuthentication();
    app.UseAuthorization();
    
    // app.UseHttpsRedirection();
    app.UseHsts();
    await using var scope = app.Services.CreateAsyncScope();
    using var db = scope.ServiceProvider.GetService<AppDbContext>();
    await db.Database.MigrateAsync();

    Console.WriteLine($"Listening on \"https://localhost:{Environment.GetEnvironmentVariable("PORT")}\"");
    
    app.Use(async (context, next) =>
    {
        Console.WriteLine($"{context.Request.Method} - {context.Request.Path}");
        await next.Invoke();
        Console.WriteLine(context.Response.StatusCode);
    });

    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine(ex);
}


