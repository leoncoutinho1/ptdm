using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Service.Services;

namespace ptdm.Api.Controllers;

[Produces("application/json")]
[Route("[controller]")]
[ApiController]
[Authorize]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _service;

    public CategoryController(ICategoryService service)
    {
        _service = service;
    }

    [HttpGet("ListCategory")]
    public ActionResult<ResultList<CategoryDTO>> ListCategory([FromQuery] CategoryFilter filters)
    {
        ResultList<CategoryDTO> result = _service.ListCategory(filters);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public ActionResult<CategoryDTO> Get(Guid id)
    {
        var result = _service.Get(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result.Value);
    }

    [HttpPost]
    public ActionResult Post([FromBody] CategoryInsertDTO category)
    {
        var result = _service.Create(category);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpPut("{id}")]
    public ActionResult Put(Guid id, CategoryUpdateDTO category)
    {
        if (id != category.Id)
        {
            return BadRequest("Route id is different from model id");
        }
        var result = _service.Update(category);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result);
    }

    [HttpDelete("{id}")]
    public ActionResult<CategoryDTO> Delete(Guid id)
    {
        var result = _service.Delete(id);
        return (result.IsError)
            ? BadRequest(result)
            : Ok(result.Value);
    }
}
