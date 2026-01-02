import { ISaleProductDTO } from "./ISaleProductDTO";

export interface ISaleDTO {
    id: string | number;
    checkoutId: string | number;
    cashierId: string | number;
    totalValue: number;
    paidValue: number;
    changeValue: number;
    overallDiscount: number;
    paymentFormId: string | number;
    createdAt: Date;
    saleProducts: ISaleProductDTO[];
}