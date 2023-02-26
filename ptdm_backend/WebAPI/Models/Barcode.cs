using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace WebAPI.Models;
[Table("barcode")]
public class Barcode
{
    [Key]
    public string Code { get; set; }
    public Guid ProductId { get; set; }

}