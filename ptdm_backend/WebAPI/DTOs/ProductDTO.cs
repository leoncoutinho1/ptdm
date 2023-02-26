using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using WebAPI.Models;

namespace WebAPI.DTOs;

public class ProductDTO
{
    public Guid Id { get; set; }
    public String Description { get; set; }
    public Double Cost { get; set; }
    public Double Price { get; set; }
    public Double Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<string> Barcodes { get; set; }
}