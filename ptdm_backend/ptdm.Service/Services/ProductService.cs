using AspNetCore.IQueryable.Extensions;
using AspNetCore.IQueryable.Extensions.Filter;
using AspNetCore.IQueryable.Extensions.Pagination;
using AspNetCore.IQueryable.Extensions.Sort;
using ErrorOr;
using Microsoft.EntityFrameworkCore;
using ptdm.Data.Context;
using ptdm.Domain.DTOs;
using ptdm.Domain.Filters;
using ptdm.Domain.Helpers;
using ptdm.Domain.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ptdm.Service.Services
{
    public interface IProductService
    {
        ErrorOr<ProductDTO> Create(ProductInsertDTO product);
        ErrorOr<ProductDTO> Delete(Guid id);
        ErrorOr<ProductDTO> Get(Guid id);
        ResultList<ProductDTO> GetProductByDescOrBarcode(string text);
        ResultList<ProductDTO> ListProduct(ProductFilter filters);
        ErrorOr<ProductDTO> Update(ProductDTO product);
        ErrorOr<string> ProcessCsvProducts(IFormFile file);
    }

    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ProductService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetUserId()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System";
        }

        public ResultList<ProductDTO> GetProductByDescOrBarcode(string text)
        {
            if (String.IsNullOrWhiteSpace(text))
                return new ResultList<ProductDTO>(Array.Empty<ProductDTO>(), 0);
                
            var products = _context.Products
                .Where(x => x.Barcodes.Any(barcode => barcode.Code == text))
                .Include(x => x.Barcodes)
                .Include(x => x.Category)
                .Include(x => x.ComponentProducts)
                    .ThenInclude(cp => cp.ComponentProduct)
                .AsNoTracking();

            if (products.Count() == 1)
            {
                return new ResultList<ProductDTO>(products.Select(x => (ProductDTO)x).ToList(), products.Count());
            }

            products = _context.Products
                .Where(x => x.Description.ToUpper().Contains(text.ToUpper()))
                .Include(x => x.Barcodes)
                .Include(x => x.Category)
                .Include(x => x.ComponentProducts)
                    .ThenInclude(cp => cp.ComponentProduct)
                .AsNoTracking();
                        
            return new ResultList<ProductDTO>(products.Select(x => (ProductDTO)x).ToList(), products.Count());
        }

        public ResultList<ProductDTO> ListProduct(ProductFilter filters)
        {
            var products = _context.Products
                .Filter(filters)
                .Sort(filters)
                .Include(x => x.Barcodes)
                .Include(x => x.Category)
                .Include(x => x.ComponentProducts)
                    .ThenInclude(cp => cp.ComponentProduct)
                .AsNoTracking();
            var count = products.Count();

            return new ResultList<ProductDTO>(products.Paginate(filters).Select(x => (ProductDTO)x).ToList(), count);
        }

        public ErrorOr<ProductDTO> Get(Guid id)
        {
            var filters = new ProductFilter();
            filters.Id = id;
            var products = _context.Products
                .Apply(filters)
                .Include(x => x.Barcodes)
                .Include(x => x.Category)
                .Include(x => x.ComponentProducts)
                    .ThenInclude(cp => cp.ComponentProduct)
                .AsNoTracking()
                .SingleOrDefault();
            return (products != null) ? (ProductDTO)products : Error.NotFound(description: "Product not found");
        }

        public ErrorOr<ProductDTO> Create(ProductInsertDTO product)
        {
            using var transaction = _context.Database.BeginTransaction();
            try {
                if (string.IsNullOrWhiteSpace(product.Unit))
                {
                    return Error.Failure(description: "A unidade é obrigatória.");
                }

                if (!product.Barcodes.Any() ||
                    (product.Barcodes.Count() == 1 && product.Barcodes.First() == String.Empty)
                )
                {
                    return Error.Failure(description: "É necessário informar ao menos um código.");
                }
                
                var existCodes = _context.Barcodes.Where(x => product.Barcodes.Contains(x.Code)).AsNoTracking().ToList();
                if (product.Barcodes.Count == existCodes.Count)
                    return Error.Failure(description: "O código informado já existe para outro produto");

                var cleanBarcodes = product.Barcodes.Where(b => !string.IsNullOrWhiteSpace(b)).ToList();
                string? mainBarcode = product.MainBarcode;
                if (string.IsNullOrWhiteSpace(mainBarcode) || !cleanBarcodes.Contains(mainBarcode))
                {
                    mainBarcode = cleanBarcodes.FirstOrDefault();
                }

                Product p = new Product
                {
                    Description = product.Description,
                    Cost = product.Cost,
                    ProfitMargin = product.Cost * 100 / product.Price,
                    Price = product.Price,
                    Quantity = product.Quantity,
                    Unit = product.Unit,
                    CategoryId = product.CategoryId,
                    Composite = product.Composite,
                    ValidityDays = product.ValidityDays,
                    IntegrateScale = product.IntegrateScale,
                    MainBarcode = mainBarcode,
                    CreatedBy = GetUserId(),
                    UpdatedBy = GetUserId()
                };

                _context.Products.Add(p);
                _context.SaveChanges();

                // Adicionar componentes se for produto composto
                if (product.Composite && product.ComponentProducts != null && product.ComponentProducts.Any())
                {
                    foreach (var component in product.ComponentProducts)
                    {
                        // Validar se o componente existe
                        var componentExists = _context.Products.Any(x => x.Id == component.ComponentProductId);
                        if (!componentExists)
                        {
                            transaction.Rollback();
                            return Error.Failure(description: $"Produto componente {component.ComponentProductId} não encontrado");
                        }

                        // Validar auto-referência
                        if (component.ComponentProductId == p.Id)
                        {
                            transaction.Rollback();
                            return Error.Failure(description: "Um produto não pode ser componente de si mesmo");
                        }

                        _context.ProductCompositions.Add(new ProductComposition
                        {
                            CompositeProductId = p.Id,
                            ComponentProductId = component.ComponentProductId,
                            Quantity = component.Quantity,
                            CreatedBy = GetUserId(),
                            UpdatedBy = GetUserId()
                        });
                    }
                    _context.SaveChanges();
                }

                foreach (var barcode in product.Barcodes)
                {
                    if (!existCodes.Any(x => x.Code == barcode))
                        _context.Barcodes.Add(new Barcode
                        {
                            ProductId = p.Id,
                            Code = barcode
                        });
                }
                _context.SaveChanges();
                transaction.Commit();

                return (ProductDTO)p;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                return Error.Failure(description: $"Erro ao processar a venda: {ex.Message}");
            }
        }

        public ErrorOr<ProductDTO> Update(ProductDTO product)
        {
            if (string.IsNullOrWhiteSpace(product.Unit))
                return Error.Failure(description: "A unidade é obrigatória.");

            if (!product.Barcodes.Any())
                return Error.Failure(description: "É necessário informar ao menos um código");

            Product? p = _context.Products.Find(product.Id);
            if (p == null)
            {
                return Error.NotFound(description: "Product not found");
            }

            var cleanBarcodes = product.Barcodes.Where(b => !string.IsNullOrWhiteSpace(b)).ToList();
            string? mainBarcode = product.MainBarcode;
            if (string.IsNullOrWhiteSpace(mainBarcode) || !cleanBarcodes.Contains(mainBarcode))
            {
                mainBarcode = cleanBarcodes.FirstOrDefault();
            }

            p.Description = product.Description;
            p.Cost = product.Cost;
            p.ProfitMargin = product.ProfitMargin;
            p.Price = product.Price;
            p.Quantity = product.Quantity;
            p.CategoryId = product.CategoryId;
            p.Composite = product.Composite;
            p.Unit = product.Unit;
            p.ImageUrl = product.ImageUrl;
            p.ValidityDays = product.ValidityDays;
            p.IntegrateScale = product.IntegrateScale;
            p.MainBarcode = mainBarcode;
            p.UpdatedBy = GetUserId();
            p.UpdatedAt = DateTime.UtcNow;

            // Atualizar componentes se for produto composto
            if (product.Composite && product.ComponentProducts != null)
            {
                // Remover componentes existentes
                var existingComponents = _context.ProductCompositions
                    .Where(pc => pc.CompositeProductId == product.Id)
                    .ToList();
                _context.ProductCompositions.RemoveRange(existingComponents);

                // Adicionar novos componentes
                foreach (var component in product.ComponentProducts)
                {
                    // Validar se o componente existe
                    var componentExists = _context.Products.Any(x => x.Id == component.ComponentProductId);
                    if (!componentExists)
                    {
                        return Error.Failure(description: $"Produto componente {component.ComponentProductId} não encontrado");
                    }

                    // Validar auto-referência
                    if (component.ComponentProductId == product.Id)
                    {
                        return Error.Failure(description: "Um produto não pode ser componente de si mesmo");
                    }

                    _context.ProductCompositions.Add(new ProductComposition
                    {
                        CompositeProductId = product.Id,
                        ComponentProductId = component.ComponentProductId,
                        Quantity = component.Quantity,
                        CreatedBy = GetUserId(),
                        UpdatedBy = GetUserId()
                    });
                }
            }
            else if (!product.Composite)
            {
                // Se deixou de ser composto, remover todos os componentes
                var existingComponents = _context.ProductCompositions
                    .Where(pc => pc.CompositeProductId == product.Id)
                    .ToList();
                _context.ProductCompositions.RemoveRange(existingComponents);
            }

            var codes = _context.Barcodes.Where(x => product.Barcodes.Contains(x.Code) || x.ProductId == product.Id);
            var existCode = 0;
            var otherProduct = 0;

            var removedCodes = codes.Where(x => x.ProductId == product.Id && !product.Barcodes.Contains(x.Code));
            foreach (var code in removedCodes)
            {
                _context.Barcodes.Remove(code);
            }

            foreach (var c in codes)
            {
                if (product.Barcodes.Contains(c.Code))
                {
                    product.Barcodes.Remove(c.Code);
                    if (c.ProductId == product.Id)
                        existCode++;
                    else
                        otherProduct++;
                }
            }

            foreach (var c in product.Barcodes)
            {
                _context.Add(new Barcode
                {
                    Code = c,
                    ProductId = product.Id
                });
                existCode++;
            }

            if (existCode == 0)
                if (otherProduct > 0)
                    return Error.Failure(description: "O código que você tentou inserir já existe para outro produto");
                else
                    return Error.Failure(description: "O Produto não possui um código");

            _context.Products.Update(p);
            _context.SaveChanges();
            return (ProductDTO)p;
        }

        public ErrorOr<ProductDTO> Delete(Guid id)
        {
            var product = _context.Products.Where(p => p.Id == id).Include(x => x.Barcodes).SingleOrDefault();

            if (product is null)
                return Error.NotFound();

            foreach (var code in product.Barcodes)
            {
                    _context.Barcodes.Remove(code);
            }

            _context.Products.Remove(product);
            _context.SaveChanges();
            return (ProductDTO)product;
        }

        public ErrorOr<string> ProcessCsvProducts(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return Error.Failure(description: "Arquivo CSV não informado ou vazio.");
            }

            var csvRows = new List<CsvProductImportRow>();

            using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
            {
                string? line;
                int lineNumber = 0;

                while ((line = reader.ReadLine()) != null)
                {
                    lineNumber++;
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    char delimiter = '\t';
                    if (line.Contains(';'))
                        delimiter = ';';
                    else if (line.Contains(','))
                        delimiter = ',';
                    else if (line.Contains('\t'))
                        delimiter = '\t';

                    var parts = line.Split(delimiter);
                    if (parts.Length < 4)
                        continue;

                    var barcode = parts[0].Trim();
                    var description = parts[1].Trim();
                    var qtyStr = parts[2].Trim();
                    var costStr = parts[3].Trim();

                    // Pula linha de cabeçalho se não for possível converter quantidade ou custo
                    if (lineNumber == 1 && (!double.TryParse(qtyStr.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out _) 
                        || !double.TryParse(costStr.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out _)))
                    {
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(barcode))
                        continue;

                    if (!double.TryParse(qtyStr.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double quantity))
                    {
                        quantity = 0;
                    }

                    if (!double.TryParse(costStr.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double cost))
                    {
                        cost = 0;
                    }

                    csvRows.Add(new CsvProductImportRow
                    {
                        Barcode = barcode,
                        Description = description,
                        Quantity = quantity,
                        Cost = cost
                    });
                }
            }

            if (!csvRows.Any())
            {
                return Error.Failure(description: "Nenhum dado válido encontrado no arquivo CSV.");
            }

            var resultBuilder = new StringBuilder();
            var userId = GetUserId().Replace("'", "''");

            var distinctCsvBarcodes = csvRows.Select(r => r.Barcode).Distinct().ToList();
            var barcodesInDb = _context.Barcodes
                .Where(b => distinctCsvBarcodes.Contains(b.Code))
                .AsNoTracking()
                .ToList();

            var existingProductIds = barcodesInDb.Select(b => b.ProductId).Distinct().ToList();
            var existingProducts = _context.Products
                .Where(p => existingProductIds.Contains(p.Id))
                .AsNoTracking()
                .ToDictionary(p => p.Id);

            var barcodeToProduct = new Dictionary<string, Product>();
            foreach (var b in barcodesInDb)
            {
                if (existingProducts.TryGetValue(b.ProductId, out var prod))
                {
                    barcodeToProduct[b.Code] = prod;
                }
            }

            var foundRows = csvRows.Where(r => barcodeToProduct.ContainsKey(r.Barcode)).ToList();
            var notFoundRows = csvRows.Where(r => !barcodeToProduct.ContainsKey(r.Barcode)).ToList();

            // 1. Produtos encontrados: agrupados por Product.Id
            var groupedFound = foundRows
                .GroupBy(r => barcodeToProduct[r.Barcode].Id)
                .ToList();

            foreach (var group in groupedFound)
            {
                var product = existingProducts[group.Key];
                var totalQuantity = group.Sum(r => r.Quantity);
                var maxCost = Math.Round(group.Max(r => r.Cost), 2);
                var newPrice = Math.Round(maxCost * 1.3, 2);
                var profitMargin = (maxCost > 0 && newPrice > 0) ? Math.Round(newPrice / maxCost * 100, 2) : 0;

                // Se o novo preço for menor que o preço atual
                if (newPrice < product.Price)
                {
                    resultBuilder.AppendLine($"-- AVISO: O novo preço calculado (R$ {newPrice.ToString("F2", CultureInfo.InvariantCulture)}) é menor que o preço atual (R$ {product.Price.ToString("F2", CultureInfo.InvariantCulture)}) para o produto '{product.Description.Replace("'", "''")}' (ID: {product.Id}).");
                }

                var updateSql = $"UPDATE product SET \"Quantity\" = {totalQuantity.ToString(CultureInfo.InvariantCulture)}, \"Cost\" = {maxCost.ToString("F2", CultureInfo.InvariantCulture)}, \"Price\" = {newPrice.ToString("F2", CultureInfo.InvariantCulture)}, \"ProfitMargin\" = {profitMargin.ToString("F2", CultureInfo.InvariantCulture)}, \"UpdatedAt\" = '{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}', \"UpdatedBy\" = '{userId}' WHERE \"Id\" = '{product.Id}';";
                resultBuilder.AppendLine(updateSql);
            }

            // 2. Produtos não encontrados: agrupados por código de barras
            var groupedNotFound = notFoundRows
                .GroupBy(r => r.Barcode)
                .ToList();

            foreach (var group in groupedNotFound)
            {
                var barcode = group.Key;
                var totalQuantity = group.Sum(r => r.Quantity);
                var maxCost = Math.Round(group.Max(r => r.Cost), 2);
                var description = group.FirstOrDefault(r => !string.IsNullOrWhiteSpace(r.Description))?.Description ?? "Sem Descrição";
                var newPrice = Math.Round(maxCost * 1.3, 2);
                var profitMargin = (maxCost > 0 && newPrice > 0) ? Math.Round(newPrice / maxCost * 100, 2) : 0;
                var newProductId = Guid.NewGuid();

                var insertProductSql = $"INSERT INTO product (\"Id\", \"Description\", \"Cost\", \"Price\", \"ProfitMargin\", \"Quantity\", \"Unit\", \"Composite\", \"ValidityDays\", \"IntegrateScale\", \"MainBarcode\", \"IsActive\", \"CreatedAt\", \"CreatedBy\", \"UpdatedAt\", \"UpdatedBy\") VALUES ('{newProductId}', '{description.Replace("'", "''")}', {maxCost.ToString("F2", CultureInfo.InvariantCulture)}, {newPrice.ToString("F2", CultureInfo.InvariantCulture)}, {profitMargin.ToString("F2", CultureInfo.InvariantCulture)}, {totalQuantity.ToString(CultureInfo.InvariantCulture)}, 'UN', false, 0, false, '{barcode.Replace("'", "''")}', true, '{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}', '{userId}', '{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}', '{userId}');";
                var insertBarcodeSql = $"INSERT INTO barcode (\"Code\", \"ProductId\") VALUES ('{barcode.Replace("'", "''")}', '{newProductId}');";

                resultBuilder.AppendLine(insertProductSql);
                resultBuilder.AppendLine(insertBarcodeSql);
            }

            return resultBuilder.ToString();
        }
    }
}
