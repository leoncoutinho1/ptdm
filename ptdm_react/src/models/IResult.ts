export interface IResult<T> {
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
    value: T,
    firstError: {
        code: string,
        description: string,
        type: number,
        numericType: number,
        metadata: any
    }
}