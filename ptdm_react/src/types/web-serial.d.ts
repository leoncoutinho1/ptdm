export { };

declare global {
    interface Navigator {
        readonly serial: Serial;
    }

    interface Serial extends EventTarget {
        onconnect: ((this: Serial, ev: SerialConnectionEvent) => any) | null;
        ondisconnect: ((this: Serial, ev: SerialConnectionEvent) => any) | null;
        getPorts(): Promise<SerialPort[]>;
        requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    }

    interface SerialPort extends EventTarget {
        onconnect: ((this: SerialPort, ev: Event) => any) | null;
        ondisconnect: ((this: SerialPort, ev: Event) => any) | null;
        readonly readable: ReadableStream<any> | null;
        readonly writable: WritableStream<any> | null;
        getInfo(): SerialPortInfo;
        open(options: SerialOptions): Promise<void>;
        setSignals(signals: SerialOutputSignals): Promise<void>;
        getSignals(): Promise<SerialInputSignals>;
        forget(): Promise<void>;
        close(): Promise<void>;
    }

    interface SerialPortRequestOptions {
        filters?: SerialPortFilter[];
    }

    interface SerialPortFilter {
        usbVendorId?: number;
        usbProductId?: number;
    }

    interface SerialOptions {
        baudRate: number;
        dataBits?: number;
        stopBits?: number;
        parity?: SerialParity;
        bufferSize?: number;
        flowControl?: SerialFlowControl;
    }

    type SerialParity = "none" | "even" | "odd";
    type SerialFlowControl = "none" | "hardware";

    interface SerialPortInfo {
        usbVendorId?: number;
        usbProductId?: number;
    }

    interface SerialOutputSignals {
        dataTerminalReady?: boolean;
        requestToSend?: boolean;
        break?: boolean;
    }

    interface SerialInputSignals {
        dataCarrierDetect: boolean;
        clearToSend: boolean;
        deviceDatasetReady: boolean;
        ringIndicator: boolean;
    }

    interface SerialConnectionEvent extends Event {
        readonly port: SerialPort;
    }
}
