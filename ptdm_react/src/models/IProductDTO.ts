export interface IProductDTO {
    id: string | number;
    description: string;
    cost: number;
    price: number;
    profitMargin: number;
    unit: string;
    quantity: number;
    createdAt: Date;
    imageUrl: string;
    isActive: boolean;
    barcodes: string[];
    categoryId?: string | number;
}