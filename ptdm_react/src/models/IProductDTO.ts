export interface IProductDTO {
    id: string | number;
    description: string;
    cost: number;
    price: number;
    profitMargin: number;
    quantity: number;
    createdAt: Date;
    imageUrl: string;
    isActive: boolean;
    barcodes: string[];
}