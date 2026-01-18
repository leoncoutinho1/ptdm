declare module '@point-of-sale/receipt-printer-encoder' {
    export default class ReceiptPrinterEncoder {
        constructor(options: {
            language?: 'esc-pos' | 'star-line' | 'star-prnt' | 'epson-esc-pos';
            width?: number;
            characterSet?: string;
            imageMode?: string;
        });

        initialize(): this;
        align(alignment: 'left' | 'center' | 'right'): this;
        text(value: string): this;
        newline(): this;
        rule(options?: { character?: string; width?: number }): this;
        cut(type?: 'full' | 'partial'): this;
        encode(): Uint8Array;
        bold(enabled: boolean): this;
        size(size: 'small' | 'normal' | 'large'): this;

        // Add other methods if needed based on common thermal printer libs
        line(value: string): this;
        barcode(value: string, type: string, width?: number): this;
        qrcode(value: string, size?: number): this;
        image(image: any, width: number, height: number, algorithm?: string): this;
    }
}
