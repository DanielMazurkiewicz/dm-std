import { Log } from '../log';
import { Obj } from '../obj';




export namespace CmdLine {
    export const logGroup = Log.Group.create(
        "dm-utils:CmdLing"
    )
    export type Trigger = string

    export interface Option {
        isArray?: boolean // determines if option values are of array type
        triggers: Trigger[];
        target?: string // destination in resulting object (if not provided then by default longest trigger stripped of minus characters is used as property name)
        // can be provided as something.something[1].something - it then should create all missing objects and arrays in resulting object - missing functions to apply that provide in Obj namespace
        type: Option.ValueType | Option.ValueType[] // can accept multiple types of value, if not array then in OptionsParsed should be still converted to array with one element
        map?: Record<string, Option.ValueMapItem>   // if provided only values from map are allowed
        default?: any                               // default value if no triggeer provided (for arrays default should be an array)
        description?: string
    }


    export namespace Option {
        export type ValueMapItem = any | {
            value: any
            description: string
        }
        export type ValueType = "none" | "float" | "integer" | "boolean" | "json" | "string"
        /*
            If multiple types provided it falls back in order of appearance above - options parsed should have sorted these types in an array in same order as above

            "none" - just a presence sets property to true 
            "boolean" - requires true or false or 1 or 0 or yes or no, 
        */
    }

    export type Options = Option[]
    
    const VALUE_TYPE_ORDER: Option.ValueType[] = ["none", "float", "integer", "boolean", "json", "string"];

    export namespace Options {
        export type Parsed = Record<Trigger, Option>

        export function parse(options: Options): Parsed {
            const parsed: Parsed = {};
            for (let i = 0; i < options.length; i++) {
                const option = Obj.clone(options[i]);

                let typeArray = Array.isArray(option.type) ? option.type : [option.type];
                
                typeArray.sort((a, b) => VALUE_TYPE_ORDER.indexOf(a) - VALUE_TYPE_ORDER.indexOf(b));
                
                option.type = typeArray;

                for (let j = 0; j < option.triggers.length; j++) {
                    const trigger = option.triggers[j];
                    if (parsed[trigger]) {
                        Log.push(`CmdLine.Options.parse: Duplicate trigger '${trigger}' detected. Overwriting.`, Log.WARN, undefined, logGroup);
                    }
                    parsed[trigger] = option;
                }
            }
            return parsed;
        }
    }

    const defaultTextErrorEmiters = {
        unknownTrigger: (trigger: Trigger) => `Unknown trigger: ${trigger}`,
        optionCannotBeRepeated: (target: string) => `Option for target '${target}' cannot be specified more than once.`,
        missingValue: (trigger: Trigger) => `Option '${trigger}' requires a value.`,
        tooManyValues: (trigger: Trigger) => `Option '${trigger}' does not accept multiple values.`,
        parsingFailed: (trigger: Trigger, value: string, types: string[]) => `For option '${trigger}', value '${value}' could not be parsed into any of the allowed types: ${types.join(', ')}`,
        invalidValueFromMap: (trigger: Trigger, value: string, allowed: string[]) => `Invalid value '${value}' for option '${trigger}'. Allowed values: ${allowed.join(', ')}`,
    }

    // Helper functions (not exported from namespace)
    function getTarget(option: Option): string {
        if (option.target) {
            return option.target;
        }
        let longestTrigger = '';
        for (let i = 0; i < option.triggers.length; i++) {
            const t = option.triggers[i];
            if (t.length > longestTrigger.length) {
                longestTrigger = t;
            }
        }
        let start = 0;
        while (longestTrigger[start] === '-') start++;
        return longestTrigger.substring(start);
    }

    function stringToArgv(line: string): string[] {
        const args: string[] = [];
        let currentArg = '';
        let inQuotes = false;
        let isEscaped = false;
        const len = line.length;

        for (let i = 0; i < len; i++) {
            const char = line[i];

            if (isEscaped) {
                currentArg += char;
                isEscaped = false;
                continue;
            }

            if (char === '\\') {
                isEscaped = true;
                continue;
            }

            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === ' ' && !inQuotes) {
                if (currentArg.length > 0) {
                    args.push(currentArg);
                    currentArg = '';
                }
                continue;
            }

            currentArg += char;
        }

        if (currentArg.length > 0) {
            args.push(currentArg);
        }

        return args;
    }

    function parseValue(value: string, allowedTypes: Option.ValueType[]): { value: any, type: Option.ValueType } | string {
        const isNumericString = (s: string) => {
            if (s.trim() === '') return false;
            const n = Number(s);
            return !isNaN(n) && isFinite(n);
        }

        for (let i = 0; i < allowedTypes.length; i++) {
            const type = allowedTypes[i];
            
            switch (type) {
                case 'float':
                    if (isNumericString(value)) {
                        return { value: parseFloat(value), type };
                    }
                    break;
                case 'integer':
                    if (isNumericString(value) && value.indexOf('.') === -1) {
                        return { value: parseInt(value, 10), type };
                    }
                    break;
                case 'boolean':
                    const lowerVal = value.toLowerCase();
                    if (lowerVal === 'true' || lowerVal === '1' || lowerVal === 'yes') return { value: true, type };
                    if (lowerVal === 'false' || lowerVal === '0' || lowerVal === 'no') return { value: false, type };
                    break;
                case 'json':
                    if ((value[0] === '{' && value[value.length - 1] === '}') || (value[0] === '[' && value[value.length - 1] === ']')) {
                        try {
                            return { value: JSON.parse(value), type };
                        } catch (e) { /* fallthrough */ }
                    }
                    break;
                case 'string':
                    return { value, type };
            }
        }
        return `Value '${value}' could not be parsed as any allowed type`;
    }

    export function parse<T>(options: Options.Parsed, line: string | string[], textErrorEmiters = defaultTextErrorEmiters): T | string {
        const argv = typeof line === 'string' ? stringToArgv(line) : line;
        const result: any = {};
        const seenTargets = new Set<string>();

        const uniqueOptions = new Map<string, Option>();
        for (const trigger in options) {
            const option = options[trigger];
            const target = getTarget(option);
            if (!uniqueOptions.has(target)) {
                uniqueOptions.set(target, option);
            }
        }

        let i = 0;
        const argvLen = argv.length;
        while (i < argvLen) {
            const rawArg = argv[i];
            let trigger = rawArg;
            let valueStr: string | undefined = undefined;

            const eqIndex = rawArg.indexOf('=');
            if (eqIndex !== -1) {
                trigger = rawArg.substring(0, eqIndex);
                valueStr = rawArg.substring(eqIndex + 1);
            }

            const option = options[trigger];
            if (!option) {
                return textErrorEmiters.unknownTrigger(trigger);
            }

            const target = getTarget(option);

            if (!option.isArray && seenTargets.has(target)) {
                return textErrorEmiters.optionCannotBeRepeated(target);
            }
            seenTargets.add(target);

            const valuesToParse: string[] = [];
            const typeArray = option.type as Option.ValueType[];

            if (valueStr !== undefined) {
                if (valueStr.length > 0) {
                    valuesToParse.push(...valueStr.split(','));
                }
            } else if (typeArray.indexOf('none') === -1 && typeArray.indexOf('boolean') === -1) {
                let j = i + 1;
                while (j < argvLen) {
                    const nextArg = argv[j];
                    let nextTrigger = nextArg;
                    const nextEqIndex = nextArg.indexOf('=');
                    if (nextEqIndex !== -1) {
                        nextTrigger = nextArg.substring(0, nextEqIndex);
                    }
                    if (options[nextTrigger] !== undefined) {
                        break;
                    }
                    valuesToParse.push(nextArg);
                    j++;
                    if (!option.isArray) break;
                }
                i = j - 1;
            }
            i++;

            if (typeArray.indexOf('none') !== -1) {
                Obj.set(result, target, true);
                continue;
            }

            if (valuesToParse.length === 0) {
                if (typeArray.indexOf('boolean') !== -1) {
                    Obj.set(result, target, true);
                    continue;
                } else {
                    return textErrorEmiters.missingValue(trigger);
                }
            }

            if (!option.isArray && valuesToParse.length > 1) {
                return textErrorEmiters.tooManyValues(trigger);
            }

            const parsedValues: any[] = [];
            for (let k = 0; k < valuesToParse.length; k++) {
                const v = valuesToParse[k];

                if (option.map) {
                    const mapEntry = option.map[v];
                    if (mapEntry === undefined) {
                        return textErrorEmiters.invalidValueFromMap(trigger, v, Object.keys(option.map));
                    }
                    parsedValues.push(typeof mapEntry === 'object' && mapEntry !== null && 'value' in mapEntry ? mapEntry.value : mapEntry);
                    continue;
                }

                const parsed = parseValue(v, typeArray);
                if (typeof parsed === 'string') {
                    return textErrorEmiters.parsingFailed(trigger, v, typeArray);
                }
                parsedValues.push(parsed.value);
            }

            if (option.isArray) {
                const existing = Obj.get(result, target);
                if (Array.isArray(existing)) {
                    for (let k = 0; k < parsedValues.length; k++) {
                        existing.push(parsedValues[k]);
                    }
                } else {
                    Obj.set(result, target, parsedValues);
                }
            } else {
                Obj.set(result, target, parsedValues[0]);
            }
        }

        for (const [target, option] of uniqueOptions.entries()) {
            if (!seenTargets.has(target) && option.default !== undefined) {
                Obj.set(result, target, option.default);
            }
        }

        return result as T;
    }
}