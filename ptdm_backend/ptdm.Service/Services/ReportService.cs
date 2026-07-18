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
                    Barcode = !string.IsNullOrWhiteSpace(p.MainBarcode) ? p.MainBarcode : (p.Barcodes.FirstOrDefault()?.Code ?? ""),
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

    public SaleReportDTO GetSaleReportData(SaleReportRequestDTO request)
    {
        // Normaliza a data final para incluir o dia inteiro
        var finalDate = request.FinalDate.HasValue
            ? request.FinalDate.Value.Date.AddDays(1).AddTicks(-1)
            : (DateTime?)null;

        var query = _context.Sales
            .Include(s => s.SaleProducts)
                .ThenInclude(sp => sp.Product)
                    .ThenInclude(p => p!.Category)
            .AsNoTracking()
            .Where(s => s.SaleDate.HasValue);

        // Filtro de data inicial
        if (request.InitialDate.HasValue)
            query = query.Where(s => s.SaleDate >= request.InitialDate.Value.Date);

        // Filtro de data final
        if (finalDate.HasValue)
            query = query.Where(s => s.SaleDate <= finalDate.Value);

        // Filtro de categoria: manter apenas vendas que tenham ao menos um produto na(s) categoria(s) selecionada(s)
        if (request.CategoryIds != null && request.CategoryIds.Any())
        {
            query = query.Where(s => s.SaleProducts.Any(sp =>
                sp.Product != null &&
                sp.Product.CategoryId.HasValue &&
                request.CategoryIds.Contains(sp.Product.CategoryId.Value)));
        }

        var sales = query.ToList();

        // Agrupar por dia
        var dayGroups = sales
            .GroupBy(s => s.SaleDate!.Value.Date)
            .OrderBy(g => g.Key);

        var days = new List<SaleReportDayDTO>();

        foreach (var dayGroup in dayGroups)
        {
            // Coletar todos os SaleProducts do dia, filtrando por categoria se necessário
            var saleProducts = dayGroup
                .SelectMany(s => s.SaleProducts)
                .Where(sp => sp.Product != null)
                .Where(sp =>
                    request.CategoryIds == null ||
                    !request.CategoryIds.Any() ||
                    (sp.Product!.CategoryId.HasValue && request.CategoryIds.Contains(sp.Product.CategoryId.Value)))
                .ToList();

            // Agrupar por categoria
            var categoryGroups = saleProducts
                .GroupBy(sp => sp.Product!.Category?.Description ?? "Sem Categoria")
                .OrderBy(g => g.Key);

            var categories = categoryGroups.Select(catGroup =>
            {
                // Agrupar por produto dentro da categoria (apenas no modo detalhado)
                var productItems = request.Detailed
                    ? catGroup
                        .GroupBy(sp => sp.Product!.Description)
                        .Select(pg => new SaleReportProductItemDTO
                        {
                            ProductDescription = pg.Key,
                            CategoryDescription = catGroup.Key,
                            TotalQuantity = pg.Sum(x => x.Quantity),
                            TotalValue = pg.Sum(x => x.Quantity * x.UnitPrice),
                            TotalDiscount = pg.Sum(x => x.Discount)
                        })
                        .OrderBy(p => p.ProductDescription)
                        .ToList()
                    : new List<SaleReportProductItemDTO>();

                var catTotalValue    = catGroup.Sum(x => x.Quantity * x.UnitPrice);
                var catTotalDiscount = catGroup.Sum(x => x.Discount);
                var catTotalQty      = catGroup.Sum(x => x.Quantity);

                return new SaleReportDayCategoryDTO
                {
                    CategoryDescription  = catGroup.Key,
                    Products             = productItems,
                    CategoryTotalQuantity = catTotalQty,
                    CategoryTotalValue   = catTotalValue,
                    CategoryTotalDiscount = catTotalDiscount
                };
            }).ToList();

            days.Add(new SaleReportDayDTO
            {
                Date = dayGroup.Key,
                Categories = categories,
                DayTotalValue = categories.Sum(c => c.CategoryTotalValue),
                DayTotalDiscount = categories.Sum(c => c.CategoryTotalDiscount)
            });
        }

        return new SaleReportDTO
        {
            Days = days,
            GrandTotalValue = days.Sum(d => d.DayTotalValue),
            GrandTotalDiscount = days.Sum(d => d.DayTotalDiscount),
            GeneratedAt = DateTime.Now,
            InitialDate = request.InitialDate,
            FinalDate = request.FinalDate,
            Detailed = request.Detailed
        };
    }

    public byte[] GenerateSaleReport(SaleReportRequestDTO request)
    {
        var reportData = GetSaleReportData(request);

        var periodLabel = (reportData.InitialDate.HasValue || reportData.FinalDate.HasValue)
            ? $"{reportData.InitialDate?.ToString("dd/MM/yyyy") ?? "?"} até {reportData.FinalDate?.ToString("dd/MM/yyyy") ?? "?"}"
            : "Período completo";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header()
                    .Column(col =>
                    {
                        col.Item().Text("Relatório de Vendas")
                            .SemiBold().FontSize(20).FontColor(Colors.Blue.Medium);
                        col.Item().Text($"Período: {periodLabel}")
                            .FontSize(10).FontColor(Colors.Grey.Darken2);
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(10);

                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Text($"Data de Geração: {reportData.GeneratedAt:dd/MM/yyyy HH:mm}");
                        });

                        column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        foreach (var day in reportData.Days)
                        {
                            // Cabeçalho do dia
                            column.Item().PaddingTop(10)
                                .Background(Colors.Blue.Lighten4)
                                .Padding(5)
                                .Text($"📅  {day.Date:dd/MM/yyyy (dddd)}")
                                .SemiBold().FontSize(13).FontColor(Colors.Blue.Darken3);

                            foreach (var category in day.Categories)
                            {
                                // Título da categoria
                                column.Item().PaddingTop(6).PaddingLeft(10)
                                    .Text(category.CategoryDescription)
                                    .SemiBold().FontSize(11).FontColor(Colors.Blue.Darken2);

                                if (request.Detailed)
                                {
                                    // Tabela de produtos (modo detalhado)
                                    column.Item().PaddingLeft(10).Table(table =>
                                    {
                                        table.ColumnsDefinition(columns =>
                                        {
                                            columns.RelativeColumn(5); // Produto
                                            columns.RelativeColumn(2); // Qtd
                                            columns.RelativeColumn(2.5f); // Valor
                                            columns.RelativeColumn(2.5f); // Desconto
                                        });

                                        table.Header(header =>
                                        {
                                            header.Cell().Element(CellStyle).Text("Produto").SemiBold();
                                            header.Cell().Element(CellStyle).AlignRight().Text("Qtd").SemiBold();
                                            header.Cell().Element(CellStyle).AlignRight().Text("Total (R$)").SemiBold();
                                            header.Cell().Element(CellStyle).AlignRight().Text("Desconto (R$)").SemiBold();
                                        });

                                        foreach (var product in category.Products)
                                        {
                                            table.Cell().Element(CellStyle).Text(product.ProductDescription);
                                            table.Cell().Element(CellStyle).AlignRight().Text($"{product.TotalQuantity:N2}");
                                            table.Cell().Element(CellStyle).AlignRight().Text($"R$ {product.TotalValue:N2}");
                                            table.Cell().Element(CellStyle).AlignRight().Text($"R$ {product.TotalDiscount:N2}");
                                        }
                                    });

                                    // Subtotal da categoria
                                    column.Item().PaddingLeft(10).AlignRight()
                                        .Text($"Subtotal {category.CategoryDescription}: R$ {category.CategoryTotalValue:N2} | Desconto: R$ {category.CategoryTotalDiscount:N2}")
                                        .Italic().FontSize(9).FontColor(Colors.Grey.Darken2);
                                }
                                else
                                {
                                    // Modo sumarizado: apenas totais da categoria em linha única
                                    column.Item().PaddingLeft(10).Table(table =>
                                    {
                                        table.ColumnsDefinition(columns =>
                                        {
                                            columns.RelativeColumn(5); // Categoria
                                            columns.RelativeColumn(2); // Qtd
                                            columns.RelativeColumn(2.5f); // Valor
                                            columns.RelativeColumn(2.5f); // Desconto
                                        });

                                        table.Header(header =>
                                        {
                                            header.Cell().Element(CellStyle).Text("Categoria").SemiBold();
                                            header.Cell().Element(CellStyle).AlignRight().Text("Qtd").SemiBold();
                                            header.Cell().Element(CellStyle).AlignRight().Text("Total (R$)").SemiBold();
                                            header.Cell().Element(CellStyle).AlignRight().Text("Desconto (R$)").SemiBold();
                                        });

                                        table.Cell().Element(CellStyle).Text(category.CategoryDescription);
                                        table.Cell().Element(CellStyle).AlignRight().Text($"{category.CategoryTotalQuantity:N2}");
                                        table.Cell().Element(CellStyle).AlignRight().Text($"R$ {category.CategoryTotalValue:N2}");
                                        table.Cell().Element(CellStyle).AlignRight().Text($"R$ {category.CategoryTotalDiscount:N2}");
                                    });
                                }
                            }

                            // Total do dia
                            column.Item().PaddingTop(4).AlignRight()
                                .Text($"Total do dia: R$ {day.DayTotalValue:N2} | Desconto: R$ {day.DayTotalDiscount:N2}")
                                .SemiBold().FontSize(11).FontColor(Colors.Blue.Darken3);

                            column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                        }

                        // Total geral
                        column.Item().PaddingTop(10).AlignRight()
                            .Text($"TOTAL GERAL: R$ {reportData.GrandTotalValue:N2} | Desconto Total: R$ {reportData.GrandTotalDiscount:N2}")
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

    public byte[] GenerateFilizolaProductsTextFile()
    {
        var products = _context.Products
            .Include(p => p.Barcodes)
            .Where(p => p.IntegrateScale == true)
            .AsNoTracking()
            .ToList();

        var sb = new System.Text.StringBuilder();

        foreach (var p in products)
        {
            // Código do Produto (Posição 01 a 06): 6 dígitos numéricos, zeros à esquerda
            var numericCode = new string((p.MainBarcode ?? "").Where(char.IsDigit).ToArray());
            if (numericCode.Length > 6)
            {
                numericCode = numericCode.Substring(numericCode.Length - 6);
            }
            var productCode = numericCode.PadLeft(6, '0');

            // Tipo de Venda (Posição 07): P para pesáveis (KG) ou U para unidade
            var saleType = (p.Unit?.ToUpper() == "KG") ? "P" : "U";

            // Descrição (Posição 08 a 29): 22 caracteres, espaços à direita, sem acentos
            var cleanDesc = RemoveAccents(p.Description ?? "");
            if (cleanDesc.Length > 22)
            {
                cleanDesc = cleanDesc.Substring(0, 22);
            }
            var description = cleanDesc.PadRight(22, ' ');

            // Preço por Quilo/Unidade (Posição 30 a 36): 7 dígitos, sem vírgula/ponto, com centavos
            var centsPrice = (int)Math.Round(p.Price * 100);
            var formattedPrice = centsPrice.ToString("D7");
            if (formattedPrice.Length > 7)
            {
                formattedPrice = formattedPrice.Substring(formattedPrice.Length - 7);
            }

            // Dias de Validade (Posição 37 a 39): 3 dígitos, zeros à esquerda
            var validity = p.ValidityDays;
            var formattedValidity = validity.ToString("D3");
            if (formattedValidity.Length > 3)
            {
                formattedValidity = formattedValidity.Substring(formattedValidity.Length - 3);
            }

            // Montar linha (Exatamente 39 caracteres)
            sb.Append(productCode)
              .Append(saleType)
              .Append(description)
              .Append(formattedPrice)
              .Append(formattedValidity)
              .Append("\r\n");
        }

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string RemoveAccents(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}
