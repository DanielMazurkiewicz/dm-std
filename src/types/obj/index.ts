export namespace Obj {
    export type Type = symbol
    export namespace Type {
        export const SYMBOL = Symbol('Type');
        export function create(name: string) {
            return Symbol(name)
        }
        export function is<T = any>(obj: any, type: symbol): obj is T {
            return obj && typeof obj === 'object' && obj[SYMBOL] === type;
        }
    }
    export function clone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime()) as any;
        }

        if (Array.isArray(obj)) {
            const arrCopy: any[] = [];
            for (let i = 0; i < obj.length; i++) {
                arrCopy[i] = clone(obj[i]);
            }
            return arrCopy as any;
        }

        const objCopy: Record<string, any> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                objCopy[key] = clone((obj as Record<string, any>)[key]);
            }
        }
        return objCopy as T;
    }


    export function get(obj: any, path: string | (string | number)[], defaultValue?: any): any {
        const pathArray = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
        
        let current = obj;
        for (let i = 0; i < pathArray.length; i++) {
            const key = pathArray[i];
            if (current === null || current === undefined || current[key as keyof typeof current] === undefined) {
                return defaultValue;
            }
            current = current[key as keyof typeof current];
        }
        return current;
    }

    export function set(obj: any, path: string | (string | number)[], value: any): any {
        const pathArray = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let current = obj;
        for (let i = 0; i < pathArray.length - 1; i++) {
            const key = pathArray[i];
            const nextKey = pathArray[i + 1];
            const isNextKeyNumeric = /^\d+$/.test(String(nextKey));

            if (current[key as keyof typeof current] === undefined || current[key as keyof typeof current] === null) {
                current[key as keyof typeof current] = isNextKeyNumeric ? [] : {};
            }
            current = current[key as keyof typeof current];
        }
        current[pathArray[pathArray.length - 1] as keyof typeof current] = value;
        return obj;
    }
}