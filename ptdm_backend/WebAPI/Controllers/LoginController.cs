using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using WebAPI.DTOs;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;

namespace WebAPI.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[AllowAnonymous]
public class LoginController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly IConfiguration _configuration;
    public LoginController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IConfiguration configuration) {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<ActionResult> RegisterUser([FromBody] RegisterUserDTO model){
        if (!ModelState.IsValid){
            return BadRequest(ModelState.Values.SelectMany(e => e.Errors));
        }

        var user = new IdentityUser(){ 
            UserName = model.Email,
            Email = model.Email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded){
            return BadRequest(result.Errors);
        }

        await _signInManager.SignInAsync(user, false);
        return Ok(GeraToken(model.Email));
    }
    [AllowAnonymous]
    [HttpPost("authenticate")]
    public async Task<ActionResult> Authenticate([FromBody] LoginDTO userInfo) {
         if (!ModelState.IsValid){
            return BadRequest(ModelState.Values.SelectMany(e => e.Errors));
        }

        var result = await _signInManager.PasswordSignInAsync(userInfo.Email, userInfo.Password, isPersistent: false, lockoutOnFailure: false);

        if (result.Succeeded){
            return Ok(GeraToken(userInfo.Email));
        } else {
            ModelState.AddModelError(string.Empty, "Login inválido");
            return BadRequest(ModelState);
        }

    }

    private string GeraToken(string email) {
        var claims = new []{
            new Claim(JwtRegisteredClaimNames.Sub, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];
        var expiry = DateTime.Now.AddMinutes(120);
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer, 
            audience: audience,
            expires: expiry,
            signingCredentials: credentials,
            claims: claims
            );
        var tokenHandler = new JwtSecurityTokenHandler();
        var stringToken = tokenHandler.WriteToken(token);
        return stringToken;

    }
}