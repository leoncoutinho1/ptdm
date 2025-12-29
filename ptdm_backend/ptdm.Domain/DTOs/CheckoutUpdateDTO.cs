using ptdm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ptdm.Domain.DTOs
{
    public class CheckoutUpdateDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public static implicit operator Checkout(CheckoutUpdateDTO dto)
        {
            return new Checkout
            {
                Id = dto.Id,
                Name = dto.Name
            };
        }
    }
}
