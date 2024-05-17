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
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using static KissLog.CloudListeners.RequestLogsListener.GenerateSearchKeywordsService;

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
                policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
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
            ValidAudience = config["JWT:Audience"],
            ValidIssuer = config["JWT:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JWT:Key"]))
        };
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
    app.MapControllers();
    if (!builder.Environment.IsProduction())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    app.MapHealthChecks("/healthcheck");
    app.MapHealthChecks("/healthchecks");
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseKissLogMiddleware(options => ConfigureKissLog(options));
    app.UseHttpsRedirection();
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


