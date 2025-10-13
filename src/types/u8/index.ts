import { U32 } from '../u32';

export type U8 = number;
export namespace U8 {
    export const MIN = 0;
    export const MAX = 255;

    /**
     * Returns a pseudo-random U8 value between 0 and 255.
     */
    export function getRandom(): U8 {
        return U32.getRandom() >>> 24;
    }

    /**
     * Returns a pseudo-random U8 between min (inclusive) and max (exclusive).
     * @param min The lower bound (inclusive), will be clamped to [0, 255].
     * @param max The upper bound (exclusive), will be clamped to [0, 256].
     * @returns A pseudo-random U8 in the specified range.
     */
    export function getRandomFromRange(min: number, max: number): U8 {
        min = Math.max(0, Math.min(MAX, Math.floor(min)));
        max = Math.max(0, Math.min(MAX + 1, Math.floor(max)));

        const range = max - min;
        if (range <= 0) {
            return min;
        }
        return min + (U32.getRandom() % range);
    }

    export function add(a: U8, b: U8): U8 {
        const result = a + b;
        if (result > MAX) return MAX;
        return result;
    }

    export function cos(val: U8): U8 {
        // Normalize input from [0, 255] range to [0, 2*PI]
        const angle = (val / MAX) * 2 * Math.PI;
        const cosResult = Math.cos(angle);
        // Denormalize result from [-1, 1] to [0, 255] and round
        return Math.round(((cosResult + 1) / 2) * MAX) | 0;
    }

    export function div(numerator: U8, denominator: U8): U8 {
        if (!denominator) {
            if (!numerator) return 1;
            return MAX;
        }
        return (numerator / denominator) | 0;
    }

    export function exp(val: U8): U8 {
        const result = Math.exp(val);
        const rounded = Math.round(result);

        if (rounded > MAX) return MAX;
        return rounded;
    }

    export function mod(numerator: U8, denominator: U8): U8 {
        if (!denominator) return 0;
        return numerator % denominator;
    }

    export function mul(a: U8, b: U8): U8 {
        const result = a * b;
        if (result > MAX) return MAX;
        return result;
    }

    export function pow(base: U8, exponent: U8): U8 {
        const result = Math.pow(base, exponent);
        if (result > MAX) return MAX;
        return result;
    }

    export function shl(a: U8, b: U8): U8 {
        const result = a << b;
        // The result should be masked to stay within u8 bounds,
        // although in JS bitwise ops work on 32-bit signed ints.
        return result & MAX;
    }

    export function shr(a: U8, b: U8): U8 {
        return a >> b;
    }

    export function sin(val: U8): U8 {
        const intVal = Math.round(val);
        // Normalize input from [0, 255] range to [0, 2*PI]
        const angle = (intVal / MAX) * 2 * Math.PI;
        const sinResult = Math.sin(angle);
        // Denormalize result from [-1, 1] to [0, 255] and round
        return Math.round(((sinResult + 1) / 2) * MAX);
    }

    export function sub(a: U8, b: U8): U8 {
        const result = a - b;
        if (result < MIN) return MIN;
        return result;
    }

    // const margin = 0.00392154852476; const margin = 0.007812341060101
    const margin = 0.0078429764378257 // limits -127.5 to 127.5 
    const MathPIOver2 = Math.PI / 2
    const lBound = -MathPIOver2 + margin;
    const hBound = MathPIOver2 - margin;
    const hlBoundDiff = hBound - lBound;
    export function tan(val: U8): U8 {

        const angle = val / MAX * hlBoundDiff + lBound
        const tanResult = Math.round(Math.tan(angle) + 127.5);
        return tanResult;
    }

    export function ter(a: U8, b: U8, c: U8, d: U8): U8 {
        return a <= b ? c : d;
    }

    const maxLog = Math.log(MAX);
    export function log(val: U8): U8 {
        if (val === 0) return 0; // log(0) is -inf, map to 0 in u8 context
        // Map [1, 255] to a reasonable log range and scale back to [0, 255]
        const logVal = Math.log(val); // log(1)=0, log(255) ~= 5.54
        return Math.round((logVal / maxLog) * MAX);
    }

}
