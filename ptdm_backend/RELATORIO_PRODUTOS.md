# Relatório de Produtos - Documentação

## Visão Geral

O sistema de relatórios permite gerar relatórios de produtos em formato PDF, com agrupamento por categoria, ordenação e totalizadores.

## Endpoints Disponíveis

### 1. Gerar Relatório em PDF

**Endpoint:** `POST /Reports/products`

**Descrição:** Gera um relatório de produtos em formato PDF e retorna o arquivo para download.

**Request Body:**
```json
{
  "categoryIds": ["guid-categoria-1", "guid-categoria-2"]
}
```

**Parâmetros:**
- `categoryIds` (opcional): Array de GUIDs das categorias a serem incluídas no relatório. Se vazio ou null, inclui todas as categorias.

**Response:**
- **Content-Type:** `application/pdf`
- **Arquivo:** `relatorio_produtos_YYYYMMDD_HHmmss.pdf`

**Exemplo de Requisição (todas as categorias):**
```bash
curl -X POST "https://api.exemplo.com/Reports/products" \
  -H "Authorization: Bearer {seu-token}" \
  -H "Content-Type: application/json" \
  -d "{}" \
  --output relatorio_produtos.pdf
```

**Exemplo de Requisição (categorias específicas):**
```bash
curl -X POST "https://api.exemplo.com/Reports/products" \
  -H "Authorization: Bearer {seu-token}" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6", "4fa85f64-5717-4562-b3fc-2c963f66afa7"]}' \
  --output relatorio_produtos.pdf
```

---

### 2. Obter Dados do Relatório (JSON)

**Endpoint:** `POST /Reports/products/data`

**Descrição:** Retorna os dados do relatório em formato JSON, sem gerar o PDF. Útil para visualização em tela ou processamento adicional.

**Request Body:**
```json
{
  "categoryIds": ["guid-categoria-1", "guid-categoria-2"]
}
```

**Response:**
```json
{
  "categories": [
    {
      "categoryDescription": "Bebidas",
      "products": [
        {
          "barcode": "7891234567890",
          "description": "Coca-Cola 2L",
          "quantity": 50.0,
          "cost": 5.50,
          "price": 8.90
        },
        {
          "barcode": "7891234567891",
          "description": "Guaraná Antarctica 2L",
          "quantity": 30.0,
          "cost": 4.80,
          "price": 7.50
        }
      ],
      "totalCost": 419.0
    },
    {
      "categoryDescription": "Alimentos",
      "products": [
        {
          "barcode": "7891234567892",
          "description": "Arroz Tipo 1 5kg",
          "quantity": 20.0,
          "cost": 18.50,
          "price": 25.90
        }
      ],
      "totalCost": 370.0
    }
  ],
  "grandTotalCost": 789.0,
  "generatedAt": "2026-01-19T19:30:00"
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "https://api.exemplo.com/Reports/products/data" \
  -H "Authorization: Bearer {seu-token}" \
  -H "Content-Type: application/json" \
  -d "{}"
```

---

## Estrutura do Relatório PDF

O relatório PDF gerado contém:

### Cabeçalho
- Título: "Relatório de Produtos"
- Data e hora de geração

### Corpo
Para cada categoria:
- **Nome da Categoria** (em destaque)
- **Tabela de Produtos** com as colunas:
  - Código (primeiro barcode do produto)
  - Descrição
  - Quantidade
  - Custo (R$)
  - Preço (R$)
- **Subtotal da Categoria** (soma dos custos)

### Rodapé
- **Total Geral** (soma de todos os custos)
- Numeração de páginas

---

## Características do Relatório

### Ordenação
- Produtos ordenados por:
  1. Categoria (alfabeticamente)
  2. Descrição do produto (alfabeticamente)

### Agrupamento
- Produtos agrupados por categoria
- Produtos sem categoria aparecem sob "Sem Categoria"

### Totalizadores
- **Subtotal por Categoria:** Soma de (Custo × Quantidade) de todos os produtos da categoria
- **Total Geral:** Soma de todos os subtotais

### Formatação
- Valores monetários formatados com 2 casas decimais (R$ 0,00)
- Quantidades formatadas com 2 casas decimais
- Layout profissional em tamanho A4
- Margens de 2cm

---

## Exemplos de Uso no Frontend

### React/TypeScript

```typescript
// Função para baixar o PDF
async function downloadProductReport(categoryIds?: string[]) {
  try {
    const response = await fetch('/Reports/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ categoryIds: categoryIds || [] })
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar relatório');
    }

    // Criar blob e fazer download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_produtos_${new Date().toISOString()}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
  }
}

// Função para obter dados do relatório
async function getProductReportData(categoryIds?: string[]) {
  try {
    const response = await fetch('/Reports/products/data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ categoryIds: categoryIds || [] })
    });

    if (!response.ok) {
      throw new Error('Erro ao obter dados do relatório');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao obter dados:', error);
    throw error;
  }
}

// Uso:
// Todas as categorias
downloadProductReport();

// Categorias específicas
downloadProductReport(['guid-1', 'guid-2']);
```

---

## Tratamento de Erros

### Possíveis Erros

**400 Bad Request:**
```json
{
  "error": "Erro ao gerar relatório",
  "message": "Detalhes do erro..."
}
```

**401 Unauthorized:**
- Token de autenticação inválido ou ausente

**500 Internal Server Error:**
- Erro no servidor ao processar o relatório

---

## Tecnologias Utilizadas

- **QuestPDF:** Biblioteca para geração de PDFs em .NET
- **Entity Framework Core:** Para consulta de dados
- **ASP.NET Core:** Framework web

---

## Notas Técnicas

1. **Performance:** O relatório é gerado em memória e retornado diretamente. Para grandes volumes de dados, considere implementar geração assíncrona.

2. **Licença QuestPDF:** Configurado para usar a licença Community (gratuita para uso não comercial).

3. **Barcode:** Apenas o primeiro código de barras de cada produto é exibido no relatório.

4. **Produtos sem Categoria:** Produtos que não possuem categoria associada aparecem agrupados sob "Sem Categoria".

5. **Autenticação:** Todos os endpoints requerem autenticação via Bearer Token.

---

## Próximas Melhorias Sugeridas

- [ ] Adicionar filtros por data de criação/atualização
- [ ] Incluir gráficos no relatório
- [ ] Opção de exportar para Excel
- [ ] Relatório de vendas por período
- [ ] Relatório de estoque baixo
- [ ] Agendamento de relatórios automáticos
- [ ] Envio de relatórios por e-mail

---

**Última atualização:** 19/01/2026  
**Versão:** 1.0
