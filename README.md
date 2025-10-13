# dm-utils

A collection of zero-dependency, type-safe numeric and utility functions for TypeScript, inspired by lower-level programming language types.

`dm-utils` provides predictable, fixed-size numeric types (`U8`, `U32`, `F64`), a powerful command-line argument parser, and a set of string and object helpers to streamline your development process. It's designed for building tools, simulations, and any environment where explicit data types and robust utilities are beneficial.

## Key Features

-   🔢 **Numeric Types**: Work with `U8`, `U32` types that clamp results to their valid ranges, preventing unexpected overflows.
-   ⚙️ **Powerful CLI Parser**: A comprehensive command-line argument parser that supports typed values, arrays, aliases, default values, and more.
-   ✍️ **Efficient String Utilities**: A set of high-performance functions (`findChar`, `skipChar`) for building your own simple and fast parsers.
-   🛠️ **Robust Object Helpers**: Safely get and set deeply nested properties in objects using dot-notation paths.
-   ✅ **Zero Dependencies**: A lightweight library that won't bloat your project.
-   🔒 **Strongly Typed**: Written entirely in TypeScript for maximum type safety.

## Installation

You can install `dm-utils` using your favorite package manager:

```bash
# Bun
bun add dm-utils

# NPM
npm install dm-utils

# Yarn
yarn add dm-utils
```

## Quick Cheat Sheet

Here are the core concepts at a glance:

```typescript
import { U8, U32, F64, CmdLine, Str, Char, Obj } from 'dm-utils';

// --- Numeric Types ---
// Operations are clamped to the type's range.
U8.add(250, 10); // => 255 (not 260)
U32.sub(5, 10);  // => 0 (not -5)

// Get a random number within the type's range.
const randomByte = U8.getRandom(); // 0-255

// --- Command-Line Parser ---
const options: CmdLine.Option[] = [{
  triggers: ['-i', '--input'],
  type: 'string',
  description: 'Input file path.'
}];
const parsedOptions = CmdLine.Options.parse(options);
const args = CmdLine.parse(parsedOptions, process.argv.slice(2));
// `args` will be an object like { input: 'path/to/file.txt' }

// --- String & Char Utilities ---
const text = "key=value;user=admin";
const separators = Char.createList(';=');
const position = Str.findChar(text, separators); // => 3 (position of '=')
const nextStart = Str.skipChar(text, separators, position); // => 4 (position of 'v')

// --- Object Utilities ---
const myObj = { config: { users: ['root'] } };
Obj.set(myObj, 'config.users[1]', 'admin');
// myObj is now { config: { users: ['root', 'admin'] } }
const user = Obj.get(myObj, 'config.users[0]'); // => 'root'
```

## Usage Examples

### 1. Building a Command-Line Tool

`CmdLine` makes it easy to create robust command-line interfaces. Let's define options for a file processing script.

```typescript
import { CmdLine } from 'dm-utils';

// 1. Define your command-line options
const options: CmdLine.Option[] = [
  {
    triggers: ['-i', '--input'],
    type: 'string',
    description: 'The path to the input file.',
  },
  {
    triggers: ['-o', '--output'],
    type: 'string',
    target: 'outputPath', // Use a different property name in the result
    default: './output.txt',
    description: 'The path for the output file.',
  },
  {
    triggers: ['--level'],
    type: 'integer',
    default: 3,
    description: 'Compression level (1-5).',
  },
  {
    triggers: ['-v', '--verbose'],
    type: 'none', // This is a flag; its presence means `true`
    description: 'Enable verbose logging.',
  },
  {
    triggers: ['--ignore'],
    type: 'string',
    isArray: true, // This option can be repeated
    description: 'File patterns to ignore.'
  }
];

// 2. Pre-parse the option definitions for efficiency
const parsedOptions = CmdLine.Options.parse(options);

// 3. Get arguments from the command line (or a string for testing)
// Example command: `node my-script.js -i data.csv --level 5 --verbose --ignore "*.tmp" --ignore "cache/*"`
const argv = ['-i', 'data.csv', '--level', '5', '--verbose', '--ignore', '*.tmp', '--ignore', 'cache/*'];

// 4. Parse the arguments
const result = CmdLine.parse<{
    input: string;
    outputPath: string;
    level: number;
    verbose: boolean;
    ignore: string[];
}>(parsedOptions, argv);


if (typeof result === 'string') {
  console.error(`Error: ${result}`);
} else {
  console.log('Arguments parsed successfully:');
  console.log(result);
  // Expected output:
  // {
  //   input: 'data.csv',
  //   level: 5,
  //   verbose: true,
  //   ignore: [ '*.tmp', 'cache/*' ],
  //   outputPath: './output.txt' // from default
  // }
}
```

### 2. Working with Numeric Types

Use `U8` to safely manipulate values that represent bytes, like RGB color components.

```typescript
import { U8 } from 'dm-utils';

// An RGB color
let color = {
    r: U8.getRandomFromRange(0, 256), // 256 is exclusive
    g: 100,
    b: 240,
};

console.log('Initial color:', color);

// Brighten the blue component.
// U8.add clamps the result to 255 if it overflows.
color.b = U8.add(color.b, 50);

console.log('Brightened color:', color); // { r: ..., g: 100, b: 255 }

// Darken the green component.
// U8.sub clamps the result to 0 if it underflows.
color.g = U8.sub(color.g, 150);

console.log('Darkened color:', color); // { r: ..., g: 0, b: 255 }
```

### 3. Simple String Parsing

Use `Str` and `Char` to quickly find tokens or split strings without the overhead of regular expressions.

```typescript
import { Str, Char } from 'dm-utils';

const configLine = " port = 8080 ; timeout=30000 ";
const WHITESPACE = Char.createList(' \t\r\n');
const SEPARATORS = Char.createList(';=');

// Trim leading whitespace
let position = Str.skipChar(configLine, WHITESPACE, 0); // position is now at 'p'

// Find the end of the key
const keyEnd = Str.findChar(configLine, WHITESPACE, position);
const key = configLine.substring(position, keyEnd); // "port"

// Find the value
position = Str.findChar(configLine, SEPARATORS, keyEnd); // position is now at '='
position = Str.skipChar(configLine, WHITESPACE, position + 1); // skip whitespace after '='
const valueEnd = Str.findChar(configLine, WHITESPACE, position);
const value = configLine.substring(position, valueEnd); // "8080"

console.log({ [key]: Number(value) }); // { port: 8080 }
```

## Full API Reference

### `CmdLine`

A powerful command-line argument parser.

#### `CmdLine.Option` Interface

This interface defines a single command-line option.

| Property      | Type                                       | Description                                                                                             |
| :------------ | :----------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| `triggers`    | `string[]`                                 | An array of triggers, e.g., `['-f', '--force']`.                                                         |
| `type`        | `ValueType` or `ValueType[]`               | The expected type(s) of the value: `"none"`, `"boolean"`, `"integer"`, `"float"`, `"json"`, `"string"`. |
| `isArray`     | `boolean` (optional)                       | If `true`, the option can be specified multiple times and values will be collected into an array.       |
| `target`      | `string` (optional)                        | The property name in the final parsed object. Defaults to the longest trigger (e.g., `--force` -> `force`). |
| `map`         | `Record<string, any>` (optional)           | A map of allowed string values to their corresponding parsed values.                                    |
| `default`     | `any` (optional)                           | A default value to use if the option is not provided.                                                   |
| `description` | `string` (optional)                        | A description of the option, for help text generation.                                                  |

#### Main Functions

-   `CmdLine.Options.parse(options: CmdLine.Option[]): Options.Parsed`
    Pre-processes an array of option definitions into an optimized map for faster parsing.

-   `CmdLine.parse<T>(options: Options.Parsed, line: string | string[]): T | string`
    Parses an argument string or array (`process.argv`) against the parsed options. Returns the populated object `T` on success or an error `string` on failure.

---

### Numeric Types (`U8`, `U32`, `F64`)

These namespaces provide functions for working with fixed-size numbers. All arithmetic operations (`add`, `sub`, `mul`, etc.) are clamped to the valid range of the type (e.g., `0-255` for `U8`).

#### Common Functions

-   `getRandom(): number`
    Returns a pseudo-random number within the type's range.
-   `getRandomFromRange(min: number, max: number): number`
    Returns a pseudo-random number in the range `[min, max)`.
-   `add(a, b)`, `sub(a, b)`, `mul(a, b)`, `div(a, b)`, `mod(a, b)`, `pow(a, b)`
    Performs standard arithmetic, clamping the result. `div` handles division by zero.
-   `shl(a, b)`, `shr(a, b)`
    Performs bitwise shifts.
-   `cos(val)`, `sin(val)`, `tan(val)`, `log(val)`, `exp(val)`
    Performs mathematical functions, mapping the type's range to a standard input range (e.g., `[0, MAX]` -> `[0, 2*PI]` for `sin`/`cos`).
-   `ter(a, b, c, d): number`
    A ternary operator: returns `c` if `a <= b`, otherwise `d`.

---

### `Str` & `Char`

Utilities for efficient, low-level string parsing.

#### `Char`

-   `type Char = string`
-   `Char.createList(list: string | string[]): Char.List`
    Creates a `Record<string, boolean>` lookup table from a string or array of strings for fast character checking.

#### `Str`

-   `findChar(text: string, chars: Char.List, startPosition?: number): number`
    Finds the first occurrence of any character from `chars` in `text`. Returns the position or `-1` (`Str.NOT_FOUND`).
-   `findCharRev(text: string, chars: Char.List, startPosition?: number): number`
    Same as `findChar`, but searches backwards from `startPosition`.
-   `skipChar(text: string, chars: Char.List, startPosition?: number): number`
    Finds the first character in `text` that is **not** in `chars`. Returns the position. Useful for skipping whitespace or delimiters.
-   `skipCharRev(text: string, chars: Char.List, startPosition?: number): number`
    Same as `skipChar`, but searches backwards.

---

### `Obj`

A small collection of helpers for object manipulation.

-   `Obj.get(obj: any, path: string): any`
    Retrieves a value from a nested object using a dot-notation path (e.g., `'a.b[0].c'`). Returns `undefined` if the path doesn't exist.
-   `Obj.set(obj: any, path: string, value: any): void`
    Sets a value in a nested object using a dot-notation path. It creates nested objects and arrays as needed.
-   `Obj.clone<T>(obj: T): T`
    Creates a copy of the given object.

---

## License

This project is licensed under the MIT License.