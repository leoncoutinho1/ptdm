# 💻 Exemplos de Integração Frontend - Produtos Compostos

## TypeScript/JavaScript - Tipos e Interfaces

```typescript
// DTOs
interface ProductCompositionDTO {
  componentProductId: string;
  componentProductDescription: string;
  quantity: number;
  componentProductPrice: number;
  componentProductCost: number;
}

interface ProductCompositionInsertDTO {
  componentProductId: string;
  quantity: number;
}

interface ProductDTO {
  id: string;
  description: string;
  cost: number;
  price: number;
  quantity: number;
  composite: boolean;
  categoryId?: string;
  categoryDescription?: string;
  imageUrl?: string;
  isActive: boolean;
  barcodes: string[];
  componentProducts?: ProductCompositionDTO[];
}

interface ProductInsertDTO {
  description: string;
  cost: number;
  price: number;
  quantity: number;
  barcode: string;
  imageUrl?: string;
  categoryId?: string;
  composite: boolean;
  componentProducts?: ProductCompositionInsertDTO[];
}
```

## React - Componente de Formulário de Produto Composto

```tsx
import React, { useState, useEffect } from 'react';

interface ProductFormProps {
  onSubmit: (product: ProductInsertDTO) => void;
  availableProducts: ProductDTO[];
}

const ProductCompositeForm: React.FC<ProductFormProps> = ({ 
  onSubmit, 
  availableProducts 
}) => {
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(0);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<ProductCompositionInsertDTO[]>([]);

  const addComponent = () => {
    setComponents([...components, { componentProductId: '', quantity: 1 }]);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: keyof ProductCompositionInsertDTO, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const product: ProductInsertDTO = {
      description,
      cost,
      price,
      quantity,
      barcode,
      composite: isComposite,
      componentProducts: isComposite ? components : undefined
    };

    onSubmit(product);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Descrição:</label>
        <input 
          type="text" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          required 
        />
      </div>

      <div>
        <label>Custo:</label>
        <input 
          type="number" 
          step="0.01"
          value={cost} 
          onChange={(e) => setCost(parseFloat(e.target.value))}
          required 
        />
      </div>

      <div>
        <label>Preço:</label>
        <input 
          type="number" 
          step="0.01"
          value={price} 
          onChange={(e) => setPrice(parseFloat(e.target.value))}
          required 
        />
      </div>

      <div>
        <label>Quantidade:</label>
        <input 
          type="number" 
          value={quantity} 
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          required 
        />
      </div>

      <div>
        <label>Código de Barras:</label>
        <input 
          type="text" 
          value={barcode} 
          onChange={(e) => setBarcode(e.target.value)}
          required 
        />
      </div>

      <div>
        <label>
          <input 
            type="checkbox" 
            checked={isComposite} 
            onChange={(e) => setIsComposite(e.target.checked)}
          />
          Produto Composto
        </label>
      </div>

      {isComposite && (
        <div className="components-section">
          <h3>Componentes</h3>
          
          {components.map((component, index) => (
            <div key={index} className="component-row">
              <select
                value={component.componentProductId}
                onChange={(e) => updateComponent(index, 'componentProductId', e.target.value)}
                required
              >
                <option value="">Selecione um produto</option>
                {availableProducts
                  .filter(p => !p.composite) // Apenas produtos simples
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.description} - Estoque: {p.quantity}
                    </option>
                  ))}
              </select>

              <input
                type="number"
                min="1"
                value={component.quantity}
                onChange={(e) => updateComponent(index, 'quantity', parseInt(e.target.value))}
                placeholder="Quantidade"
                required
              />

              <button type="button" onClick={() => removeComponent(index)}>
                Remover
              </button>
            </div>
          ))}

          <button type="button" onClick={addComponent}>
            + Adicionar Componente
          </button>
        </div>
      )}

      <button type="submit">Salvar Produto</button>
    </form>
  );
};

export default ProductCompositeForm;
```

## React - Componente de Visualização de Produto Composto

```tsx
import React from 'react';

interface ProductDetailProps {
  product: ProductDTO;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const calculateTotalComponentCost = () => {
    if (!product.componentProducts) return 0;
    
    return product.componentProducts.reduce(
      (total, comp) => total + (comp.componentProductCost * comp.quantity),
      0
    );
  };

  const calculateProfitMargin = () => {
    const totalCost = calculateTotalComponentCost();
    if (totalCost === 0) return 0;
    
    return ((product.price - totalCost) / product.price) * 100;
  };

  return (
    <div className="product-detail">
      <h2>{product.description}</h2>
      
      <div className="product-info">
        <p><strong>Preço:</strong> R$ {product.price.toFixed(2)}</p>
        <p><strong>Estoque:</strong> {product.quantity} unidades</p>
        <p><strong>Tipo:</strong> {product.composite ? 'Produto Composto' : 'Produto Simples'}</p>
      </div>

      {product.composite && product.componentProducts && (
        <div className="components-section">
          <h3>Componentes</h3>
          
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Custo Unit.</th>
                <th>Custo Total</th>
              </tr>
            </thead>
            <tbody>
              {product.componentProducts.map((comp, index) => (
                <tr key={index}>
                  <td>{comp.componentProductDescription}</td>
                  <td>{comp.quantity}</td>
                  <td>R$ {comp.componentProductCost.toFixed(2)}</td>
                  <td>R$ {(comp.componentProductCost * comp.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}><strong>Custo Total dos Componentes:</strong></td>
                <td><strong>R$ {calculateTotalComponentCost().toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td colSpan={3}><strong>Preço de Venda:</strong></td>
                <td><strong>R$ {product.price.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td colSpan={3}><strong>Margem de Lucro:</strong></td>
                <td><strong>{calculateProfitMargin().toFixed(2)}%</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="barcodes">
        <h3>Códigos de Barras</h3>
        <ul>
          {product.barcodes.map((barcode, index) => (
            <li key={index}>{barcode}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProductDetail;
```

## Service/API - Funções de Integração

```typescript
// api/productService.ts
import axios from 'axios';

const API_BASE_URL = 'https://your-api.com';

export const productService = {
  // Criar produto (simples ou composto)
  async createProduct(product: ProductInsertDTO): Promise<ProductDTO> {
    const response = await axios.post(`${API_BASE_URL}/Product`, product);
    return response.data.value;
  },

  // Buscar produto por ID (inclui componentes se for composto)
  async getProduct(id: string): Promise<ProductDTO> {
    const response = await axios.get(`${API_BASE_URL}/Product/${id}`);
    return response.data.value;
  },

  // Listar produtos
  async listProducts(filters?: any): Promise<{ data: ProductDTO[], total: number }> {
    const response = await axios.get(`${API_BASE_URL}/Product/ListProduct`, {
      params: filters
    });
    return {
      data: response.data.data,
      total: response.data.count
    };
  },

  // Atualizar produto
  async updateProduct(id: string, product: ProductDTO): Promise<ProductDTO> {
    const response = await axios.put(`${API_BASE_URL}/Product/${id}`, product);
    return response.data.value;
  },

  // Deletar produto
  async deleteProduct(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/Product/${id}`);
  },

  // Buscar produtos simples (para usar como componentes)
  async getSimpleProducts(): Promise<ProductDTO[]> {
    const response = await axios.get(`${API_BASE_URL}/Product/ListProduct`);
    return response.data.data.filter((p: ProductDTO) => !p.composite);
  }
};
```

## React Hook Customizado

```typescript
// hooks/useCompositeProduct.ts
import { useState, useEffect } from 'react';
import { productService } from '../api/productService';

export const useCompositeProduct = (productId?: string) => {
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [availableComponents, setAvailableComponents] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableComponents();
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);

  const loadProduct = async (id: string) => {
    setLoading(true);
    try {
      const data = await productService.getProduct(id);
      setProduct(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableComponents = async () => {
    try {
      const products = await productService.getSimpleProducts();
      setAvailableComponents(products);
    } catch (err: any) {
      console.error('Erro ao carregar componentes:', err);
    }
  };

  const saveProduct = async (productData: ProductInsertDTO) => {
    setLoading(true);
    setError(null);
    try {
      if (product?.id) {
        await productService.updateProduct(product.id, { ...product, ...productData });
      } else {
        await productService.createProduct(productData);
      }
      return true;
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.description || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateStock = (components: ProductCompositionInsertDTO[]): string | null => {
    for (const comp of components) {
      const availableProduct = availableComponents.find(p => p.id === comp.componentProductId);
      if (!availableProduct) {
        return `Produto componente não encontrado`;
      }
      if (availableProduct.quantity < comp.quantity) {
        return `Estoque insuficiente de ${availableProduct.description}`;
      }
    }
    return null;
  };

  return {
    product,
    availableComponents,
    loading,
    error,
    saveProduct,
    validateStock,
    refreshProduct: loadProduct
  };
};
```

## Exemplo de Uso Completo

```tsx
// pages/ProductForm.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCompositeForm from '../components/ProductCompositeForm';
import { useCompositeProduct } from '../hooks/useCompositeProduct';

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { 
    product, 
    availableComponents, 
    loading, 
    error, 
    saveProduct,
    validateStock 
  } = useCompositeProduct(id);

  const handleSubmit = async (productData: ProductInsertDTO) => {
    // Validar estoque se for produto composto
    if (productData.composite && productData.componentProducts) {
      const stockError = validateStock(productData.componentProducts);
      if (stockError) {
        alert(stockError);
        return;
      }
    }

    const success = await saveProduct(productData);
    if (success) {
      alert('Produto salvo com sucesso!');
      navigate('/products');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>{id ? 'Editar Produto' : 'Novo Produto'}</h1>
      <ProductCompositeForm 
        onSubmit={handleSubmit}
        availableProducts={availableComponents}
        initialData={product}
      />
    </div>
  );
};

export default ProductFormPage;
```

## Validações no Frontend

```typescript
// utils/productValidation.ts

export const validateCompositeProduct = (
  product: ProductInsertDTO,
  availableProducts: ProductDTO[]
): string[] => {
  const errors: string[] = [];

  if (!product.description || product.description.trim() === '') {
    errors.push('Descrição é obrigatória');
  }

  if (product.price <= 0) {
    errors.push('Preço deve ser maior que zero');
  }

  if (product.composite) {
    if (!product.componentProducts || product.componentProducts.length === 0) {
      errors.push('Produto composto deve ter pelo menos um componente');
    }

    if (product.componentProducts) {
      // Verificar duplicatas
      const componentIds = product.componentProducts.map(c => c.componentProductId);
      const uniqueIds = new Set(componentIds);
      if (componentIds.length !== uniqueIds.size) {
        errors.push('Não é permitido adicionar o mesmo componente mais de uma vez');
      }

      // Verificar se componentes existem
      product.componentProducts.forEach((comp, index) => {
        const exists = availableProducts.find(p => p.id === comp.componentProductId);
        if (!exists) {
          errors.push(`Componente ${index + 1} não encontrado`);
        }

        if (comp.quantity <= 0) {
          errors.push(`Quantidade do componente ${index + 1} deve ser maior que zero`);
        }
      });
    }
  }

  return errors;
};
```

## CSS Exemplo

```css
/* styles/ProductForm.css */

.components-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.component-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.component-row select {
  flex: 2;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.component-row input[type="number"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.component-row button {
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.component-row button:hover {
  background-color: #c82333;
}

.product-detail table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.product-detail th,
.product-detail td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.product-detail th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.product-detail tfoot td {
  font-weight: bold;
  background-color: #f8f9fa;
}
```

---

## 🎯 Checklist de Implementação Frontend

- [ ] Criar interfaces TypeScript para DTOs
- [ ] Implementar formulário de produto composto
- [ ] Adicionar seleção de componentes
- [ ] Implementar validação de estoque
- [ ] Criar visualização de produto composto
- [ ] Adicionar cálculo de margem de lucro
- [ ] Implementar hook customizado
- [ ] Adicionar tratamento de erros
- [ ] Criar testes unitários
- [ ] Adicionar feedback visual (loading, success, error)

---

## 💡 Dicas

1. **Validação em Tempo Real**: Valide o estoque dos componentes enquanto o usuário seleciona
2. **Feedback Visual**: Mostre alertas quando o estoque de um componente estiver baixo
3. **Cálculo Automático**: Calcule automaticamente o custo total baseado nos componentes
4. **Sugestão de Preço**: Sugira um preço de venda baseado no custo + margem desejada
5. **Histórico**: Mostre histórico de vendas do produto composto
