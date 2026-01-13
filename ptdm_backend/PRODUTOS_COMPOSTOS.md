# Produtos Compostos - Documentação

## Visão Geral

Foi implementado um sistema de auto-relacionamento N para N que permite criar **produtos compostos** - produtos formados por outros produtos.

## Estrutura Implementada

### 1. Classe `Product` (Atualizada)

**Novo atributo:**
- `Composite` (bool): Indica se o produto é composto por outros produtos. Padrão: `false`

**Novas coleções de navegação:**
- `ComponentProducts`: Lista de produtos que compõem este produto (quando este produto é composto)
- `CompositeProducts`: Lista de produtos compostos que este produto ajuda a formar (quando este produto é um componente)

### 2. Classe `ProductComposition` (Nova)

Tabela de relacionamento que conecta produtos compostos aos seus componentes.

**Propriedades:**
- `CompositeProductId` (Guid): ID do produto composto (produto principal)
- `CompositeProduct` (Product): Navegação para o produto composto
- `ComponentProductId` (Guid): ID do produto componente
- `ComponentProduct` (Product): Navegação para o produto componente
- `Quantity` (double): Quantidade do produto componente consumida na venda do produto composto

**Chave Primária:** Composta por `CompositeProductId` + `ComponentProductId`

## Exemplo de Uso

### Cenário: Combo de Hambúrguer

Imagine que você quer criar um "Combo Hambúrguer" composto por:
- 1 Hambúrguer
- 1 Batata Frita
- 1 Refrigerante

```csharp
// 1. Criar o produto composto
var combo = new Product
{
    Description = "Combo Hambúrguer",
    Price = 25.00,
    Composite = true, // Indica que é um produto composto
    // ... outras propriedades
};

// 2. Adicionar os componentes
combo.ComponentProducts = new List<ProductComposition>
{
    new ProductComposition
    {
        ComponentProductId = hamburguerGuid,
        Quantity = 1
    },
    new ProductComposition
    {
        ComponentProductId = batataGuid,
        Quantity = 1
    },
    new ProductComposition
    {
        ComponentProductId = refrigeranteGuid,
        Quantity = 1
    }
};
```

### Consultar Componentes de um Produto Composto

```csharp
var combo = await context.Products
    .Include(p => p.ComponentProducts)
        .ThenInclude(pc => pc.ComponentProduct)
    .FirstOrDefaultAsync(p => p.Id == comboId);

foreach (var component in combo.ComponentProducts)
{
    Console.WriteLine($"{component.ComponentProduct.Description}: {component.Quantity}");
}
```

### Consultar em quais produtos compostos um produto é usado

```csharp
var hamburguer = await context.Products
    .Include(p => p.CompositeProducts)
        .ThenInclude(pc => pc.CompositeProduct)
    .FirstOrDefaultAsync(p => p.Id == hamburguerId);

foreach (var composite in hamburguer.CompositeProducts)
{
    Console.WriteLine($"Usado em: {composite.CompositeProduct.Description} (Qtd: {composite.Quantity})");
}
```

## Lógica de Negócio Sugerida

### Ao Vender um Produto Composto

Quando um produto composto for vendido, você deve:

1. Decrementar o estoque do produto composto (se aplicável)
2. Decrementar o estoque de cada componente pela quantidade especificada

```csharp
public async Task SellCompositeProduct(Guid productId, double quantitySold)
{
    var product = await context.Products
        .Include(p => p.ComponentProducts)
            .ThenInclude(pc => pc.ComponentProduct)
        .FirstOrDefaultAsync(p => p.Id == productId);
    
    if (product == null) throw new Exception("Produto não encontrado");
    
    // Se for produto composto, decrementar estoque dos componentes
    if (product.Composite)
    {
        foreach (var component in product.ComponentProducts)
        {
            var componentProduct = component.ComponentProduct;
            var quantityToDeduct = component.Quantity * quantitySold;
            
            if (componentProduct.Quantity < quantityToDeduct)
            {
                throw new Exception($"Estoque insuficiente de {componentProduct.Description}");
            }
            
            componentProduct.Quantity -= quantityToDeduct;
        }
    }
    
    // Decrementar estoque do produto principal (se aplicável)
    product.Quantity -= quantitySold;
    
    await context.SaveChangesAsync();
}
```

## Próximos Passos

1. **Criar Migration:**
   ```bash
   cd ptdm_backend/ptdm.Data
   dotnet ef migrations add AddProductComposition --startup-project ../ptdm.API
   dotnet ef database update --startup-project ../ptdm.API
   ```

2. **Atualizar DTOs:** Criar DTOs para expor informações de produtos compostos na API

3. **Criar Endpoints:** Criar endpoints para gerenciar composições de produtos

4. **Implementar Validações:**
   - Impedir que um produto seja componente de si mesmo
   - Impedir ciclos (Produto A compõe B, B compõe C, C compõe A)
   - Validar estoque disponível dos componentes

5. **Atualizar Frontend:** Criar interface para gerenciar produtos compostos

## Observações Importantes

- Um produto pode ser componente de múltiplos produtos compostos
- Um produto composto pode ter múltiplos componentes
- A quantidade na tabela `ProductComposition` indica quantas unidades do componente são consumidas por unidade do produto composto
- O `DeleteBehavior.Restrict` impede exclusão acidental de produtos que fazem parte de composições
