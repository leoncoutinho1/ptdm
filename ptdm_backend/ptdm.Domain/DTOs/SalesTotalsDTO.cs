namespace ptdm.Domain.DTOs;

public class SalesTotalsDTO
{
    public string Period { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public double TotalValue { get; set; }
}
