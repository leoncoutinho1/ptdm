namespace ptdm.Domain.DTOs;

public class ScaleProductDTO
{
    public string MainBarcode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public double Price { get; set; }
}
