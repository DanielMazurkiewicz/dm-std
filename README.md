# dm-std

A collection of zero-dependency, type-safe numeric and utility functions for TypeScript, inspired by lower-level programming language types.

`dm-std` provides predictable, fixed-size numeric types (`U8`, `U32`, `F64`), a powerful command-line argument parser, structured logging, file system abstractions, and a comprehensive set of string and object helpers to streamline your development process. It's designed for building tools, simulations, games, and any environment where explicit data types, performance, and robust utilities are beneficial.

Unlike many utility libraries, `dm-std` emphasizes type safety, predictable behavior (like clamped arithmetic), and zero runtime dependencies, making it ideal for constrained environments or when you need fine-grained control over numeric operations.

## Key Features

-   🔢 **Numeric Types**: Work with `U8`, `U32`, `F64` types that clamp results to their valid ranges, preventing unexpected overflows.
-   ⚙️ **Powerful CLI Parser**: A comprehensive command-line argument parser that supports typed values, arrays, aliases, default values, and more.
-   📝 **Structured Logging**: A flexible logging system with levels, groups, and streaming capabilities.
-   💾 **File System Abstractions**: Cross-platform file system operations with Bun, Node.js, and in-memory implementations.
-   ✍️ **Efficient String Utilities**: A set of high-performance functions (`findChar`, `skipChar`) for building your own simple and fast parsers.
-   🛠️ **Robust Object Helpers**: Safely get and set deeply nested properties in objects using dot-notation paths.
-   ✅ **Zero Dependencies**: A lightweight library that won't bloat your project.
-   🔒 **Strongly Typed**: Written entirely in TypeScript for maximum type safety.

## Installation

You can install `dm-std` using your favorite package manager:

```bash
# Bun
bun add dm-std

# NPM
npm install dm-std

# Yarn
yarn add dm-std
```

## Project Structure

```
src/
├── types/           # Numeric type implementations
│   ├── u8/         # 8-bit unsigned integers
│   ├── u32/        # 32-bit unsigned integers
│   ├── f64/        # 64-bit floating point numbers
│   ├── arr/        # Array utilities (under development)
│   ├── date_time/  # Date/time utilities
│   └── obj/        # Object utilities (under development)
├── log/            # Structured logging system
├── cmd_line/       # Command-line argument parser
├── str/            # String processing utilities
├── char/           # Character utilities
├── obj/            # Object manipulation helpers
└── file_system/    # Cross-platform file system abstractions
    ├── disk_bun.ts    # Bun runtime implementation
    ├── disk_node.ts   # Node.js implementation
    ├── disk_memory.ts # In-memory implementation
    ├── models.ts      # Type definitions
    └── index.ts       # Exports
```

## Quick Cheat Sheet

Here are the core concepts at a glance:

```typescript
import { U8, U32, F64, CmdLine, Str, Char, Obj, Log, DateTime, BunFileSystem, NodeFileSystem, MemoryFileSystem } from 'dm-std';

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

// --- Logging ---
Log.push('Application started', Log.INFO);
const entry = Log.streamStart(Log.DEBUG);
// ... do some work ...
Log.stream(entry, 'Processing item 1');
Log.streamEnd(entry);

// --- Date/Time ---
const now = DateTime.now(); // Current timestamp

// --- File System ---
const fs = BunFileSystem; // or NodeFileSystem or MemoryFileSystem
await fs.writeFile('example.txt', Buffer.from('Hello World'));
const content = await fs.readFile('example.txt');

// Copy operations
await fs.copy('example.txt', '/backup'); // Copy file to directory
await fs.copy('/source/dir', '/dest'); // Copy directory recursively
await fs.copy('example.txt', '/backup', { newName: 'backup.txt' }); // Copy with new name
```

## Usage Examples

### 1. Building a Command-Line Tool

`CmdLine` makes it easy to create robust command-line interfaces. Let's define options for a file processing script.

```typescript
import { CmdLine } from 'dm-std';

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
import { U8 } from 'dm-std';

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
import { Str, Char } from 'dm-std';

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

### 4. Structured Logging

Use the `Log` namespace for flexible, structured logging with levels and groups.

```typescript
import { Log } from 'dm-std';

// Create a log group for your application
const appLogGroup = Log.Group.create('my-app', 'Application logs');

// Log messages with different levels
Log.push('Application started', Log.INFO, undefined, appLogGroup);
Log.push('Warning: Low memory', Log.WARN, { memoryUsage: 85 }, appLogGroup);

// Stream logging for ongoing operations
const processEntry = Log.streamStart(Log.DEBUG, appLogGroup);
Log.stream(processEntry, 'Processing file 1...');
Log.stream(processEntry, 'Processing file 2...');
Log.streamEnd(processEntry);

// Output logs to console
Log.Group.toConsole(appLogGroup);
```

### 5. File System Operations

Use file system abstractions for cross-platform file operations.

```typescript
import { BunFileSystem, NodeFileSystem, MemoryFileSystem } from 'dm-std';

// Choose your file system implementation
const fs = BunFileSystem; // or NodeFileSystem or MemoryFileSystem

// Basic file operations
await fs.writeFile('data.txt', Buffer.from('Hello World'));
const content = await fs.readFile('data.txt');
console.log(content.toString()); // "Hello World"

// Directory operations
await fs.createDir('output');
const files = await fs.readDir('output');

// Path utilities
const fullPath = fs.join('path', 'to', 'file.txt');
const isAbs = fs.isAbsolute('/absolute/path');
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

These namespaces provide functions for working with fixed-size numbers. All arithmetic operations are clamped to the valid range of the type to prevent overflow/underflow.

#### `U8` (8-bit unsigned integer, range: 0-255)

-   `U8.MIN = 0`, `U8.MAX = 255`
-   `U8.getRandom(): U8`
    Returns a pseudo-random number within the type's range.
-   `U8.getRandomFromRange(min: number, max: number): U8`
    Returns a pseudo-random number in the range `[min, max)`.
-   Arithmetic: `add(a, b)`, `sub(a, b)`, `mul(a, b)`, `div(a, b)`, `mod(a, b)`, `pow(a, b)`
-   Bitwise: `shl(a, b)`, `shr(a, b)`
-   Math: `cos(val)`, `sin(val)`, `tan(val)`, `log(val)`, `exp(val)`
-   `U8.ter(a, b, c, d): U8`
    Ternary operator: returns `c` if `a <= b`, otherwise `d`.

#### `U32` (32-bit unsigned integer, range: 0-4294967295)

-   `U32.MIN = 0`, `U32.MAX = 4294967295`
-   `U32.setSeed(newSeed: U32): void`
    Sets the seed for the random number generator.
-   `U32.getRandom(): U32`
    Returns a pseudo-random number within the type's range.
-   `U32.getRandomFromRange(min: number, max: number): number`
    Returns a pseudo-random number in the range `[min, max)`.
-   Arithmetic: `add(a, b)`, `sub(a, b)`, `mul(a, b)`, `div(a, b)`, `mod(a, b)`, `pow(a, b)`
-   Bitwise: `shl(a, b)`, `shr(a, b)`
-   Math: `cos(val)`, `sin(val)`, `tan(val)`, `log(val)`, `exp(val)`
-   `U32.ter(a, b, c, d): U32`
    Ternary operator: returns `c` if `a <= b`, otherwise `d`.

#### `F64` (64-bit floating point)

-   `F64.getRandom(): F64`
    Returns a pseudo-random number in the range `[0, 1)`.
-   `F64.getRandomFromRange(min: F64, max: F64): F64`
    Returns a pseudo-random number in the range `[min, max)`.
-   Arithmetic: `add(a, b)`, `sub(a, b)`, `mul(a, b)`, `div(a, b)`, `mod(a, b)`, `pow(a, b)`
-   Bitwise: `shl(a, b)`, `shr(a, b)` (interpreted as power-of-2 multiplication/division)
-   Math: `cos(val)`, `sin(val)`, `tan(val)`, `log(val)`, `exp(val)`
-   `F64.ter(a, b, c, d): F64`
    Ternary operator: returns `c` if `a <= b`, otherwise `d`.

---

### `Str` & `Char`

Utilities for efficient, low-level string parsing.

#### `Char`

-   `type Char = string`
-   `Char.createList(list: string | string[]): Char.List`
    Creates a `Record<string, boolean>` lookup table from a string or array of strings for fast character checking.

#### `Str`

-   `type Str = string`
-   `Str.findChar(text: string, chars: Char.List, startPosition?: number): number`
    Finds the first occurrence of any character from `chars` in `text`. Returns the position or `Str.NOT_FOUND` (-1).
-   `Str.findCharRev(text: string, chars: Char.List, startPosition?: number): number`
    Same as `findChar`, but searches backwards from `startPosition`.
-   `Str.skipChar(text: string, chars: Char.List, startPosition?: number): number`
    Finds the first character in `text` that is **not** in `chars`. Returns the position. Useful for skipping whitespace or delimiters.
-   `Str.skipCharRev(text: string, chars: Char.List, startPosition?: number): number`
    Same as `skipChar`, but searches backwards.
-   `Str.isNotFound(position: Position): boolean`
    Checks if a position indicates "not found".
-   `Str.isEndOfString(text: string, position: Position): boolean`
    Checks if a position is at or beyond the end of the string.

---

### `Obj`

A collection of helpers for object manipulation.

-   `Obj.get(obj: any, path: string | (string | number)[], defaultValue?: any): any`
    Retrieves a value from a nested object using a dot-notation path (e.g., `'a.b[0].c'`) or an array of path segments. Returns the default value if the path doesn't exist.
-   `Obj.set(obj: any, path: string | (string | number)[], value: any): any`
    Sets a value in a nested object using a dot-notation path or array of path segments. It creates nested objects and arrays as needed.
-   `Obj.clone<T>(obj: T): T`
    Creates a deep copy of the given object.

---

### `Arr`

Array utilities namespace (currently under development).

---

### File System Abstractions

Cross-platform file system operations with multiple implementations.

#### Available Implementations

-   `BunFileSystem`: Optimized for Bun runtime
-   `NodeFileSystem`: Standard Node.js file system operations
-   `MemoryFileSystem`: In-memory file system for testing

#### Common Operations

All implementations provide the same `FileSystemOperations` interface:

-   **Directory Operations**:
    -   `createDir(dirPath: string): Promise<void>`
    -   `readDir(dirPath: string): Promise<string[]>`

-   **File Operations**:
    -   `readFile(filePath: string): Promise<Buffer>`
    -   `writeFile(filePath: string, data: Buffer): Promise<boolean>`
    -   `remove(path: string, recursive?: boolean): Promise<boolean>`
    -   `copy(src: string | string[], dest: string, options?: { newName?: string }): Promise<boolean>`
        Copies files or directories. If `src` is a file, copies the file to the `dest` directory. If `src` is a directory, recursively copies the entire directory to the `dest` directory. `dest` is always treated as a directory to copy into. The optional `newName` parameter allows renaming the copied item.

-   **Path Checking Operations**:
    -   `exist(path: string): Promise<boolean>`
    -   `isFile(path: string): Promise<boolean>`
    -   `isDirectory(path: string): Promise<boolean>`
    -   `getSize(path: string): Promise<number>`
    -   `fileExist(path: string | string[]): Promise<string | undefined>`

-   **Working Directory Operations**:
    -   `getCwd(): string`
    -   `setCwd(path: string): boolean`

-   **Path Utilities**:
    -   `isAbsolute(path: string): boolean`
    -   `join(...paths: string[]): string`
    -   `dirname(path: string): string`
    -   `relative(from: string, to: string): string`

---

## Design Philosophy

`dm-std` is built with several key principles in mind:

- **Type Safety First**: Everything is strongly typed with TypeScript
- **Predictable Behavior**: Numeric operations are clamped to prevent overflow/underflow surprises
- **Zero Dependencies**: No external runtime dependencies for maximum compatibility
- **Performance Conscious**: Efficient algorithms and data structures
- **Cross-Platform**: Works across different JavaScript runtimes (Node.js, Bun, etc.)
- **Composable**: Small, focused utilities that work well together

## Development

This project uses TypeScript and is designed to work with modern JavaScript runtimes including Node.js and Bun.

### Building

The project is distributed as TypeScript source code that can be imported directly. No build step is required for end users.

### Contributing

Contributions are welcome! Please ensure that:

- All code follows the existing TypeScript patterns
- Functions are properly typed
- New features include appropriate documentation
- Tests are added for new functionality

## License

This project is licensed under the MIT License.