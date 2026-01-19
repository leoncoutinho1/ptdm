using Microsoft.EntityFrameworkCore;
using ptdm.Data.Context;
using ptdm.Domain.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ptdm.Service.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
        
        // Configurar licença do QuestPDF (Community License)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public ProductReportDTO GetProductReportData(ProductReportRequestDTO request)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Barcodes)
            .AsNoTracking();

        // Aplicar filtro de categorias se fornecido
        if (request.CategoryIds != null && request.CategoryIds.Any())
        {
            query = query.Where(p => p.CategoryId.HasValue && request.CategoryIds.Contains(p.CategoryId.Value));
        }

        // Buscar produtos ordenados por categoria e descrição
        var products = query
            .OrderBy(p => p.Category != null ? p.Category.Description : "Sem Categoria")
            .ThenBy(p => p.Description)
            .ToList();

        // Agrupar por categoria
        var groupedByCategory = products
            .GroupBy(p => p.Category?.Description ?? "Sem Categoria")
            .Select(g => new ProductReportCategoryDTO
            {
                CategoryDescription = g.Key,
                Products = g.Select(p => new ProductReportItemDTO
                {
                    Barcode = p.Barcodes.FirstOrDefault()?.Code ?? "",
                    Description = p.Description,
                    Quantity = p.Quantity,
                    Cost = p.Cost,
                    Price = p.Price
                }).ToList(),
                TotalCost = g.Sum(p => p.Cost * p.Quantity)
            })
            .ToList();

        var report = new ProductReportDTO
        {
            Categories = groupedByCategory,
            GrandTotalCost = groupedByCategory.Sum(c => c.TotalCost),
            GeneratedAt = DateTime.Now
        };

        return report;
    }

    public byte[] GenerateProductReport(ProductReportRequestDTO request)
    {
        var reportData = GetProductReportData(request);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Text("Relatório de Produtos")
                    .SemiBold().FontSize(20).FontColor(Colors.Blue.Medium);

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(10);

                        // Informações do relatório
                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Text($"Data de Geração: {reportData.GeneratedAt:dd/MM/yyyy HH:mm}");
                        });

                        column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        // Iterar por cada categoria
                        foreach (var category in reportData.Categories)
                        {
                            // Título da categoria
                            column.Item().PaddingTop(10).Text(category.CategoryDescription)
                                .SemiBold().FontSize(14).FontColor(Colors.Blue.Darken2);

                            // Tabela de produtos da categoria
                            column.Item().Table(table =>
                            {
                                // Definir colunas
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(2); // Código de Barras
                                    columns.RelativeColumn(4); // Descrição
                                    columns.RelativeColumn(1.5f); // Quantidade
                                    columns.RelativeColumn(1.5f); // Custo
                                    columns.RelativeColumn(1.5f); // Preço
                                });

                                // Cabeçalho da tabela
                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("Código").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Descrição").SemiBold();
                                    header.Cell().Element(CellStyle).AlignRight().Text("Qtd").SemiBold();
                                    header.Cell().Element(CellStyle).AlignRight().Text("Custo").SemiBold();
                                    header.Cell().Element(CellStyle).AlignRight().Text("Preço").SemiBold();
                                });

                                // Linhas de produtos
                                foreach (var product in category.Products)
                                {
                                    table.Cell().Element(CellStyle).Text(product.Barcode);
                                    table.Cell().Element(CellStyle).Text(product.Description);
                                    table.Cell().Element(CellStyle).AlignRight().Text($"{product.Quantity:N2}");
                                    table.Cell().Element(CellStyle).AlignRight().Text($"R$ {product.Cost:N2}");
                                    table.Cell().Element(CellStyle).AlignRight().Text($"R$ {product.Price:N2}");
                                }
                            });

                            // Subtotal da categoria
                            column.Item().PaddingTop(5).AlignRight()
                                .Text($"Subtotal (Custo): R$ {category.TotalCost:N2}")
                                .SemiBold().FontSize(11);

                            column.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                        }

                        // Total geral
                        column.Item().PaddingTop(10).AlignRight()
                            .Text($"TOTAL GERAL (Custo): R$ {reportData.GrandTotalCost:N2}")
                            .SemiBold().FontSize(14).FontColor(Colors.Blue.Darken2);
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Página ");
                        x.CurrentPageNumber();
                        x.Span(" de ");
                        x.TotalPages();
                    });
            });
        });

        return document.GeneratePdf();
    }

    private static IContainer CellStyle(IContainer container)
    {
        return container
            .BorderBottom(1)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(5);
    }
}
