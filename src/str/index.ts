import { Char } from "../char"

export type Str = string
export namespace Str {
    export type Position = number
    export const NOT_FOUND: Position = -1


    export function isNotFound(position: Position) {
        return position === NOT_FOUND
    }

    export function isEndOfString(text: string, position: Position) {
        return position >= text.length
    }

    export function findChar(text: string, chars: Char.List, startPosition = 0): Position {
        const len = text.length;
        for (let i = startPosition; i < len; i++) {
            if (chars[text[i]]) {
                return i;
            }
        }
        return NOT_FOUND;
    }

    export function findCharRev(text: string, chars: Char.List, startPosition = text.length - 1): Position {
        for (let i = startPosition; i >= 0; i--) {
            if (chars[text[i]]) {
                return i;
            }
        }
        return NOT_FOUND;
    }


    export function skipChar(text: string, chars: Char.List, startPosition = 0): Position {
        const len = text.length;
        let i = startPosition;
        while (i < len && chars[text[i]]) {
            i++;
        }
        return i;
    }

    export function skipCharRev(text: string, chars: Char.List, startPosition = text.length - 1): Position {
        let i = startPosition;
        while (i >= 0 && chars[text[i]]) {
            i--;
        }
        return i;
    }

}