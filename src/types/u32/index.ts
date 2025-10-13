export type U32 = number;
export namespace U32 {
    export const MIN = 0;
    export const MAX = 4294967295;

    let seed = 0xDEADBEEF

    export function setSeed(newSeed: U32) {
        seed = newSeed === 0 ? 0xDEADBEEF : newSeed;
    }

    export function getRandom(): U32 {
        let x = seed;
        x ^= x << 13;
        x ^= x >>> 17; // Use logical right shift for unsigned behavior
        x ^= x << 5;
        seed = x; // The state is updated for the next call
        return x >>> 0; // Ensure the result is a 32-bit unsigned integer
    }

    /**
     * Get random number from range.
     * @param min included
     * @param max not included
     * @returns 
     */
    export function getRandomFromRange(min: number, max: number): number {
        const range = max - min;
        if (range <= 0) {
            return min;
        }
        return min + (getRandom() % range);
    }

    export function add(a: U32, b: U32): U32 {
        const result = a + b;
        return result > MAX ? MAX : result;
    }

    export function sub(a: U32, b: U32): U32 {
        const result = a - b;
        return result < MIN ? MIN : result;
    }

    export function mul(a: U32, b: U32): U32 {
        const result = a * b;
        return result > MAX ? MAX : result;
    }

    export function div(numerator: U32, denominator: U32): U32 {
        if (denominator === 0) {
            return numerator === 0 ? 1 : MAX;
        }
        return (numerator / denominator) | 0;
    }

    export function mod(numerator: U32, denominator: U32): U32 {
        if (denominator === 0) return 0;
        return numerator % denominator;
    }

    export function pow(base: U32, exponent: U32): U32 {
        const result = Math.pow(base, exponent);
        return result > MAX ? MAX : result;
    }

    export function shl(a: U32, b: U32): U32 {
        return (a << b) >>> 0;
    }

    export function shr(a: U32, b: U32): U32 {
        return a >>> b;
    }

    export function cos(val: U32): U32 {
        const angle = (val / MAX) * 2 * Math.PI;
        const cosResult = Math.cos(angle);
        return Math.round(((cosResult + 1) / 2) * MAX) >>> 0;
    }

    export function sin(val: U32): U32 {
        const angle = (val / MAX) * 2 * Math.PI;
        const sinResult = Math.sin(angle);
        return Math.round(((sinResult + 1) / 2) * MAX) >>> 0;
    }


    const margin = 0.0078429764378257 // limits -127.5 to 127.5 
    const MathPIOver2 = Math.PI / 2
    const lBound = -MathPIOver2 + margin;
    const hBound = MathPIOver2 - margin;
    const hlBoundDiff = hBound - lBound;
    export function tan(val: U32): U32 {

        const angle = (val / MAX) * hlBoundDiff + lBound;
        const tanResult = Math.tan(angle) + (MAX / 2);

        if (tanResult > MAX) return MAX;
        if (tanResult < MIN) return MIN;
        return Math.round(tanResult) >>> 0;
    }

    const EPSILON = 1e-9;
    export function log(val: U32): U32 {
        const absVal = Math.abs(val);
        if (absVal < EPSILON) {
            return 0;
        }
        const result = Math.log(absVal);
        if (result > MAX) return MAX;
        if (result < MIN) return MIN;
        return Math.round(result) >>> 0;
    }

    export function exp(val: U32): U32 {
        const result = Math.exp(val);
        return result > MAX ? MAX : Math.round(result) >>> 0;
    }

    export function ter(a: U32, b: U32, c: U32, d: U32): U32 {
        return a <= b ? c : d;
    }
}