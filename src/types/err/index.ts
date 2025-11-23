// Error

import { Obj } from "../obj";


export interface Err <ERROR_DATA = any, ERROR_DATA_FOR_HANDLER = any> {
    [Obj.Type.SYMBOL]: Obj.Type;
    description: string
    errorData?: ERROR_DATA
    errorDataForHandler?: ERROR_DATA_FOR_HANDLER

    filePath?: string
    fileLine?: number

}

export namespace Err {
    export const TYPE = Obj.Type.create("Err")
    export function create<ERROR_DATA = any, ERROR_DATA_FOR_HANDLER = any>(
        description: string,
        errorData?: ERROR_DATA,
        errorDataForHandler?: ERROR_DATA_FOR_HANDLER,
        filePath?: string,
        fileLine?: number
    ): Err<ERROR_DATA, ERROR_DATA_FOR_HANDLER> {
        return {
            [Obj.Type.SYMBOL]: TYPE,
            description,
            errorData,
            errorDataForHandler,
            filePath,
            fileLine
        };
    }

    export function is<ERROR_DATA = any, ERROR_DATA_FOR_HANDLER = any>(data: any): data is Err<ERROR_DATA, ERROR_DATA_FOR_HANDLER> {
        return Obj.Type.is(data, TYPE);
    }

    export function fromError(err: Error): Err<Error> {
        return create(err.message, err);
    }
}