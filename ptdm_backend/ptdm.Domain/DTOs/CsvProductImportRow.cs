namespace ptdm.Domain.DTOs;

public class CsvProductImportRow
{
    public string Barcode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Quantity { get; set; }
    public double Cost { get; set; }
}
