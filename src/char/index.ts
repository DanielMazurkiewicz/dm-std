export type Char = string
export namespace Char {

    export type List = Record<Char, boolean>


    export function createList(list: string | string[]): List {
        const result: List = {};
        if (typeof list === 'string') {
            for (let i = 0; i < list.length; i++) {
                result[list[i]] = true;
            }
        } else {
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                for (let j = 0; j < item.length; j++) {
                    result[item[j]] = true;
                }
            }
        }
        return result;
    }


}