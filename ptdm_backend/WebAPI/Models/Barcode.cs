using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace WebAPI.Models;

public class Barcode
{

    public string Code { get; set; }
    public Guid ProductId { get; set; }

}