using System.Reflection;
using KissLog;
using KissLog.AspNetCore;
using KissLog.CloudListeners.Auth;
using KissLog.CloudListeners.RequestLogsListener;
using KissLog.Formatters;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.OpenApi.Models;
using Serilog;
using WebAPI;
using WebAPI.Data;
using WebAPI.Repositories;

using Microsoft.Extensions.Options;

Console.WriteLine("App started");

try
{
    var builder = WebApplication.CreateBuilder(args);
    var config = builder.Configuration;
    builder.Host.UseSerilog(Log.Logger);

    var mappingConfig = new MapperConfiguration(mc =>
    {
        mc.AddProfile(new MappingProfile());
    });

    IMapper mapper = mappingConfig.CreateMapper();

    string connectionString = config.GetConnectionString("DefaultConnection");

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(config.GetConnectionString("DefaultConnection"))
    );

    builder.Services.AddIdentity<IdentityUser, IdentityRole>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();
    
    builder.Services.AddControllers();
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
    builder.Services.AddSingleton(mapper);
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "API PDV", Version = "v1" });
        var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
    });
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(
            policy =>
            {
                policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
            });
    });

    builder.Services.ConfigureApplicationCookie(options =>
    {
        // Cookie settings
        options.Cookie.HttpOnly = true;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(5);

        options.LoginPath = "/Identity/Account/Login";
        options.AccessDeniedPath = "/Identity/Account/AccessDenied";
        options.SlidingExpiration = true;
    });


    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<IKLogger>((provider) => Logger.Factory.Get());
    builder.Services.AddHealthChecks();
    builder.Services.AddLogging(logging =>
    {
        logging.AddKissLog(options =>
        {
            options.Formatter = (FormatterArgs args) =>
            {
                if (args.Exception == null)
                    return args.DefaultValue;

                string exceptionStr = new ExceptionFormatter().Format(args.Exception, args.Logger);

                return string.Join(Environment.NewLine, new[] { args.DefaultValue, exceptionStr });
            };
        });
    });
   
    var app = builder.Build();
    app.MapControllers();
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapHealthChecks("/healthcheck");
    app.MapHealthChecks("/healthchecks");
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseKissLogMiddleware(options => ConfigureKissLog(options));
    
    await using var scope = app.Services.CreateAsyncScope();
    using var db = scope.ServiceProvider.GetService<AppDbContext>();
    await db.Database.MigrateAsync();

    Console.WriteLine("Run app");
    
    app.Use(async (context, next) =>
    {
        Console.WriteLine($"{context.Request.Method} - {context.Request.Path}");
        await next.Invoke();
        Console.WriteLine(context.Response.StatusCode);
    });
    app.Run();

    void ConfigureKissLog(IOptionsBuilder options)
    {
        KissLogConfiguration.Listeners
                    .Add(new RequestLogsApiListener(new Application(builder.Configuration["KissLog.OrganizationId"], builder.Configuration["KissLog.ApplicationId"]))
                    {
                        ApiUrl = builder.Configuration["KissLog.ApiUrl"]
                    });
    }
}
catch (Exception ex)
{
    Console.WriteLine(ex);
    Log.Fatal(ex, "Host terminated unexpectedly");
}


