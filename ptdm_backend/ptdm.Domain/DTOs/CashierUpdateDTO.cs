using ptdm.Domain.Models;

namespace ptdm.Domain.DTOs
{
    public class CashierUpdateDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public static implicit operator Cashier(CashierUpdateDTO dto)
        {
            return new Cashier
            {
                Id = dto.Id,
                Name = dto.Name
            };
        }
    }
}
