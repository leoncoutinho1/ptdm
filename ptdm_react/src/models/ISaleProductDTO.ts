import { IProductDTO } from "./IProductDTO";

export interface ISaleProductDTO {
    saleId: string | number;
    productId: string | number;
    unitPrice: number;
    product: IProductDTO;
    quantity: number;
    discount: number;
}