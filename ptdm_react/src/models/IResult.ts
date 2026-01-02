export interface IResult {
    isError: boolean,
    errors: [
        {
            code: string,
            description: string,
            type: number,
            numericType: number,
            metadata: any
        }
    ],
    errorsOrEmptyList: [
        {
            code: string,
            description: string,
            type: number,
            numericType: number,
            metadata: any
        }
    ],
    value: any,
    firstError: {
        code: string,
        description: string,
        type: number,
        numericType: number,
        metadata: any
    }
}