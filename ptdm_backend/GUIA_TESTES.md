# 🧪 Guia de Testes - Produtos Compostos

## Pré-requisitos

1. Banco de dados atualizado com a migration
2. API rodando
3. Ferramenta de teste de API (Postman, Insomnia, ou similar)
4. Produtos simples já cadastrados no sistema

---

## 📝 Cenário de Teste Completo

### Passo 1: Criar Produtos Simples (Componentes)

Primeiro, crie os produtos que serão componentes do combo:

#### 1.1 Criar Hambúrguer
```http
POST /Product
Content-Type: application/json
Authorization: Bearer {seu-token}

{
  "description": "Hambúrguer Artesanal",
  "cost": 5.00,
  "price": 10.00,
  "quantity": 50,
  "barcode": "HAMB001",
  "categoryId": null,
  "composite": false
}
```

**Resposta esperada:** Status 200
```json
{
  "value": {
    "id": "guid-hamburguer",
    "description": "Hambúrguer Artesanal",
    "cost": 5.00,
    "price": 10.00,
    "quantity": 50,
    "composite": false,
    ...
  }
}
```

**⚠️ IMPORTANTE:** Salve o `id` retornado!

#### 1.2 Criar Batata Frita
```http
POST /Product
Content-Type: application/json

{
  "description": "Batata Frita",
  "cost": 3.00,
  "price": 8.00,
  "quantity": 100,
  "barcode": "BATA001",
  "composite": false
}
```

**⚠️ IMPORTANTE:** Salve o `id` retornado!

#### 1.3 Criar Refrigerante
```http
POST /Product
Content-Type: application/json

{
  "description": "Refrigerante 350ml",
  "cost": 2.00,
  "price": 5.00,
  "quantity": 200,
  "barcode": "REFR001",
  "composite": false
}
```

**⚠️ IMPORTANTE:** Salve o `id` retornado!

---

### Passo 2: Criar Produto Composto (Combo)

Agora crie o combo usando os IDs dos produtos criados anteriormente:

```http
POST /Product
Content-Type: application/json

{
  "description": "Combo Hambúrguer Completo",
  "cost": 10.00,
  "price": 20.00,
  "quantity": 30,
  "barcode": "COMBO001",
  "composite": true,
  "componentProducts": [
    {
      "componentProductId": "{guid-hamburguer}",
      "quantity": 1
    },
    {
      "componentProductId": "{guid-batata}",
      "quantity": 1
    },
    {
      "componentProductId": "{guid-refrigerante}",
      "quantity": 1
    }
  ]
}
```

**Resposta esperada:** Status 200
```json
{
  "value": {
    "id": "guid-combo",
    "description": "Combo Hambúrguer Completo",
    "composite": true,
    "componentProducts": [
      {
        "componentProductId": "guid-hamburguer",
        "componentProductDescription": "Hambúrguer Artesanal",
        "quantity": 1,
        "componentProductPrice": 10.00,
        "componentProductCost": 5.00
      },
      ...
    ]
  }
}
```

---

### Passo 3: Consultar Produto Composto

Verifique se o produto foi criado corretamente:

```http
GET /Product/{guid-combo}
```

**Validações:**
- ✅ `composite` deve ser `true`
- ✅ `componentProducts` deve conter 3 itens
- ✅ Cada componente deve ter descrição, preço e quantidade

---

### Passo 4: Testar Venda de Produto Composto

#### 4.1 Verificar Estoque Antes da Venda

```http
GET /Product/{guid-hamburguer}
GET /Product/{guid-batata}
GET /Product/{guid-refrigerante}
GET /Product/{guid-combo}
```

**Anote as quantidades:**
- Hambúrguer: 50
- Batata: 100
- Refrigerante: 200
- Combo: 30

#### 4.2 Realizar Venda de 2 Combos

```http
POST /Sale
Content-Type: application/json

{
  "cashierId": "{guid-cashier}",
  "checkoutId": "{guid-checkout}",
  "paymentFormId": "{guid-payment-form}",
  "totalValue": 40.00,
  "paidValue": 50.00,
  "changeValue": 10.00,
  "overallDiscount": 0,
  "saleProducts": [
    {
      "productId": "{guid-combo}",
      "quantity": 2,
      "unitPrice": 20.00,
      "discount": 0
    }
  ]
}
```

**Resposta esperada:** Status 200

#### 4.3 Verificar Estoque Após a Venda

```http
GET /Product/{guid-hamburguer}
GET /Product/{guid-batata}
GET /Product/{guid-refrigerante}
GET /Product/{guid-combo}
```

**Quantidades esperadas:**
- Hambúrguer: 48 (50 - 2) ✅
- Batata: 98 (100 - 2) ✅
- Refrigerante: 198 (200 - 2) ✅
- Combo: 28 (30 - 2) ✅

---

### Passo 5: Testar Validação de Estoque Insuficiente

#### 5.1 Criar Produto com Estoque Baixo

```http
POST /Product
Content-Type: application/json

{
  "description": "Molho Especial",
  "cost": 1.00,
  "price": 3.00,
  "quantity": 1,
  "barcode": "MOLHO001",
  "composite": false
}
```

#### 5.2 Criar Combo que Usa Molho

```http
POST /Product
Content-Type: application/json

{
  "description": "Combo Premium",
  "cost": 15.00,
  "price": 30.00,
  "quantity": 10,
  "barcode": "COMBOPREM001",
  "composite": true,
  "componentProducts": [
    {
      "componentProductId": "{guid-hamburguer}",
      "quantity": 1
    },
    {
      "componentProductId": "{guid-molho}",
      "quantity": 2
    }
  ]
}
```

#### 5.3 Tentar Vender Combo Premium

```http
POST /Sale
Content-Type: application/json

{
  "saleProducts": [
    {
      "productId": "{guid-combo-premium}",
      "quantity": 1,
      "unitPrice": 30.00,
      "discount": 0
    }
  ],
  ...
}
```

**Resposta esperada:** Status 400 (Bad Request)
```json
{
  "errors": [
    {
      "description": "Estoque insuficiente de Molho Especial. Disponível: 1, Necessário: 2"
    }
  ]
}
```

---

### Passo 6: Testar Atualização de Produto Composto

#### 6.1 Atualizar Componentes do Combo

```http
PUT /Product/{guid-combo}
Content-Type: application/json

{
  "id": "{guid-combo}",
  "description": "Combo Hambúrguer Completo",
  "cost": 10.00,
  "price": 20.00,
  "quantity": 28,
  "composite": true,
  "barcodes": ["COMBO001"],
  "componentProducts": [
    {
      "componentProductId": "{guid-hamburguer}",
      "quantity": 2
    },
    {
      "componentProductId": "{guid-batata}",
      "quantity": 1
    }
  ]
}
```

**Validações:**
- ✅ Refrigerante foi removido dos componentes
- ✅ Hambúrguer agora usa quantidade 2

#### 6.2 Vender e Verificar Novo Comportamento

Venda 1 combo e verifique:
- Hambúrguer: -2 unidades
- Batata: -1 unidade
- Refrigerante: sem alteração

---

### Passo 7: Testar Cancelamento de Venda

#### 7.1 Anotar Estoque Atual

```http
GET /Product/{guid-hamburguer}
GET /Product/{guid-combo}
```

#### 7.2 Deletar uma Venda

```http
DELETE /Sale/{guid-sale}
```

#### 7.3 Verificar Reversão de Estoque

Os estoques devem voltar aos valores anteriores à venda.

---

### Passo 8: Testar Validações

#### 8.1 Tentar Criar Produto que é Componente de Si Mesmo

```http
POST /Product
Content-Type: application/json

{
  "description": "Produto Recursivo",
  "cost": 10.00,
  "price": 20.00,
  "quantity": 10,
  "barcode": "RECUR001",
  "composite": true,
  "componentProducts": [
    {
      "componentProductId": "{mesmo-id-do-produto}",
      "quantity": 1
    }
  ]
}
```

**Resposta esperada:** Status 400
```json
{
  "errors": [
    {
      "description": "Um produto não pode ser componente de si mesmo"
    }
  ]
}
```

#### 8.2 Tentar Usar Componente Inexistente

```http
POST /Product
Content-Type: application/json

{
  "description": "Combo Inválido",
  "composite": true,
  "componentProducts": [
    {
      "componentProductId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  ...
}
```

**Resposta esperada:** Status 400
```json
{
  "errors": [
    {
      "description": "Produto componente 00000000-0000-0000-0000-000000000000 não encontrado"
    }
  ]
}
```

---

## ✅ Checklist de Validação

Após executar todos os testes, verifique:

- [ ] Produtos simples são criados corretamente
- [ ] Produtos compostos são criados com componentes
- [ ] Consulta retorna componentes completos
- [ ] Venda decrementa estoque do combo E dos componentes
- [ ] Validação de estoque insuficiente funciona
- [ ] Mensagem de erro é clara e informativa
- [ ] Atualização de componentes funciona
- [ ] Cancelamento de venda reverte estoque corretamente
- [ ] Validação de auto-referência funciona
- [ ] Validação de componente inexistente funciona

---

## 🐛 Troubleshooting

### Erro: "Product not found"
- Verifique se os GUIDs estão corretos
- Confirme que os produtos foram criados com sucesso

### Erro: "Unauthorized"
- Verifique se o token de autenticação está válido
- Confirme que o header Authorization está presente

### Estoque não está sendo decrementado
- Verifique se a migration foi aplicada
- Confirme que o produto está marcado como `composite: true`
- Verifique os logs do servidor

### Build com warnings
- Os warnings são normais do projeto
- Se houver erros de compilação, verifique as referências

---

## 📊 Resultados Esperados

Ao final dos testes, você deve ter:

1. ✅ Produtos simples criados
2. ✅ Produtos compostos funcionando
3. ✅ Controle de estoque automático
4. ✅ Validações impedindo operações inválidas
5. ✅ Reversão de estoque em cancelamentos

**Status esperado:** Todos os testes passando! 🎉
