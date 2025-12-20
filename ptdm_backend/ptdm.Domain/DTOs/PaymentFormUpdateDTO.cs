using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ptdm.Domain.DTOs
{
    public class PaymentFormUpdateDTO
    {
        public Guid Id { get; set; }
        public string Description { get; set; }
    }
}
