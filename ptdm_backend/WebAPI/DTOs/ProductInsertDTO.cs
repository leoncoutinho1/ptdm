using WebAPI.Models;

namespace WebAPI.DTOs;

public class ProductInsertDTO
{
    
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double Quantity { get; set; }
}