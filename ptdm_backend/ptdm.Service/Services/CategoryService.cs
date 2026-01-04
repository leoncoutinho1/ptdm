using AspNetCore.IQueryable.Extensions;
using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions.Pagination;
using AspNetCore.IQueryable.Extensions.Sort;
using ErrorOr;
using Microsoft.EntityFrameworkCore;
using ptdm.Data.Context;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ptdm.Service.Services
{
    public interface ICategoryService
    {
        ErrorOr<CategoryDTO> Create(CategoryInsertDTO category);
        ErrorOr<CategoryDTO> Delete(Guid id);
        ErrorOr<CategoryDTO> Get(Guid id);
        ResultList<CategoryDTO> ListCategory(CategoryFilter filters);
        ErrorOr<CategoryDTO> Update(CategoryUpdateDTO category);
    }

    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CategoryService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetUserId()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
        }

        public ResultList<CategoryDTO> ListCategory(CategoryFilter filters)
        {
            var categories = _context.Categories.Filter(filters).Sort(filters).AsNoTracking();
            var count = categories.Count();

            return new ResultList<CategoryDTO>(categories.Paginate(filters).Select(x => (CategoryDTO)x).ToList(), count);
        }

        public ErrorOr<CategoryDTO> Get(Guid id)
        {
            var category = _context.Categories.AsNoTracking().FirstOrDefault(x => x.Id == id);
            return (category != null) ? (CategoryDTO)category : Error.NotFound(description: "Category not found");
        }

        public ErrorOr<CategoryDTO> Create(CategoryInsertDTO categoryDto)
        {
            Category category = new Category
            {
                Description = categoryDto.Description,
                CreatedBy = GetUserId(),
                UpdatedBy = GetUserId()
            };

            try
            {
                _context.Categories.Add(category);
                _context.SaveChanges();
                return (CategoryDTO)category;
            }
            catch (Exception)
            {
                return Error.Failure(description: "Category can't be created");
            }
        }

        public ErrorOr<CategoryDTO> Update(CategoryUpdateDTO categoryDto)
        {
            var category = _context.Categories.FirstOrDefault(x => x.Id == categoryDto.Id);
            if (category == null) return Error.NotFound();

            category.Description = categoryDto.Description;
            category.UpdatedBy = GetUserId();
            category.UpdatedAt = DateTime.UtcNow;

            try
            {
                _context.Categories.Update(category);
                _context.SaveChanges();
                return (CategoryDTO)category;
            }
            catch (Exception)
            {
                return Error.Failure(description: "Category can't be updated");
            }
        }

        public ErrorOr<CategoryDTO> Delete(Guid id)
        {
            var category = _context.Categories.FirstOrDefault(x => x.Id == id);
            if (category == null) return Error.NotFound();

            try
            {
                _context.Categories.Remove(category);
                _context.SaveChanges();
                return (CategoryDTO)category;
            }
            catch (Exception)
            {
                return Error.Failure(description: "Category can't be deleted. It might be in use.");
            }
        }
    }
}
