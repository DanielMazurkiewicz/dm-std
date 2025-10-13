import { U32 } from '../u32';

export type F64 = number;
export namespace F64 {
    // TODO:
    // export const MIN =
    // export const MAX =
    
    const EPSILON = 1e-9;
    const RAND_MAX_U32 = 2 ** 31;

    /**
     * Returns a pseudo-random F64 between 0.0 (inclusive) and 1.0 (exclusive).
     */
    export function getRandom(): F64 {
        return U32.getRandom() / RAND_MAX_U32;
    }

    /**
     * Returns a pseudo-random F64 between min (inclusive) and max (exclusive).
     * @param min The lower bound (inclusive).
     * @param max The upper bound (exclusive).
     * @returns A pseudo-random F64 in the specified range.
     */
    export function getRandomFromRange(min: F64, max: F64): F64 {
        return min + getRandom() * (max - min);
    }

    export function add(a: F64, b: F64): F64 {
        return a + b;
    }
    
    export const cos = Math.cos;
    
    export function div(numerator: F64, denominator: F64): F64 {
        if (Math.abs(denominator) < EPSILON) {
            if (Math.abs(numerator) < EPSILON) return 1.0;
            return numerator > 0 ? Infinity : -Infinity;
        }
        return numerator / denominator;
    }

    export const exp = Math.exp;

    export function log(val: F64): F64 {
        const absVal = Math.abs(val);
        if (absVal < EPSILON) {
            return Math.log(EPSILON);
        }
        return Math.log(absVal);
    }
    
    export function mod(numerator: F64, denominator: F64): F64 {
        return 0;
    }
    
    export function mul(a: F64, b: F64): F64 {
        return a * b;
    }

    export function pow(base: F64, exponent: F64): F64 {
        return Math.pow(base, Math.round(exponent));
    }
    
    export function shl(a: F64, b: F64): F64 {
        // A bitwise operation on a float is not well-defined.
        // We can interpret it as multiplication by a power of 2.
        return a * Math.pow(2, Math.round(b));
    }
    
    export function shr(a: F64, b: F64): F64 {
        // A bitwise operation on a float is not well-defined.
        // We can interpret it as division by a power of 2.
        return a / Math.pow(2, Math.round(b));
    }

    export const sin = Math.sin;
    
    export function sub(a: F64, b: F64): F64 {
        return a - b;
    }
    
    export const tan = Math.tan;

    export function ter(a: F64, b: F64, c: F64, d: F64): F64 {
        return a <= b ? c : d;
    }
}