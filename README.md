
# dm-std

**A standard library for TypeScript focused on predictability, type safety, and cross-runtime compatibility.**

`dm-std` brings the precision of lower-level languages to TypeScript. It provides clamped numeric types to prevent logic errors, a powerful declarative command-line parser, unified file system abstractions (running seamlessly on Node, Bun, or Memory), and high-performance string scanning utilities.

It is designed for building **CLIs**, **simulations**, **game logic**, and **robust tools** where explicit data types and predictable behavior are paramount.

---

## 🚀 Key Features

*   **🛡️ Clamped Numeric Types**: `U8`, `U32`, and `F64` implementations. Math operations (`add`, `sub`, `div`, `pow`) are clamped to bounds, preventing overflows/underflows. Includes integer-mapped trigonometry (`sin`, `cos` on integers).
*   **💾 Universal File System**: Write code once, run anywhere. Switch between **Bun**, **Node.js**, and **Memory** (Virtual FS) implementations instantly. Perfect for unit testing file manipulations without touching the disk.
*   **💻 Robust CLI Parser**: A declarative, type-safe argument parser. Supports typed values (`int`, `float`, `json`, `bool`), validation maps, aliases, array accumulation, and deep object targeting.
*   **⚡ Fast String Scanning**: Lookup-table based `findChar` / `skipChar` utilities for building high-performance parsers.
*   **📦 Zero Dependencies**: Lightweight and completely self-contained.

---

## 📦 Installation

```bash
# Bun
bun add dm-std

# NPM
npm install dm-std

# Yarn
yarn add dm-std
```

---

## ⚡ Quick Cheat Sheet

```typescript
import { U8, CmdLine, Str, Char, BunFileSystem, NodeFileSystem, MemoryFileSystem } from 'dm-std';

// --- 1. Clamped Arithmetic (U8: 0-255) ---
U8.add(250, 20); // => 255 (Clamped at MAX, no rollover)
U8.sub(5, 10);   // => 0   (Clamped at MIN)
U8.div(100, 0);  // => 255 (Safe division, no Infinity)

// --- 2. Universal File System ---
// Switch implementation based on environment (Disk for Prod, Memory for Test)
const fs = (process.env.NODE_ENV === 'test') ? new MemoryFileSystem() : new BunFileSystem();

await fs.writeFileAsJSON('config.json', { volume: 100 }, true); // Pretty print
await fs.streamTo('config.json', new MemoryFileSystem(), '/virtual/backup.json'); // Pipe between FS types!

// --- 3. Fast String Scanning ---
const input = "key=value; type=u8";
const DELIMITERS = Char.createList('=; '); // O(1) lookup table

// Skip spaces
const start = Str.skipChar(input, Char.createList(' '), 0);
// Find next delimiter
const next = Str.findChar(input, DELIMITERS, start); 

// --- 4. CLI Parsing ---
const rawOptions = [
    { triggers: ['-p', '--port'], type: 'integer', default: 8080 },
    { triggers: ['--config'], type: 'json' } // Parses '{"a":1}' automatically
];

// Parse args (automagically handles arrays, flags, and type conversion)
const args = CmdLine.parse(
    CmdLine.Options.parse(rawOptions), 
    process.argv.slice(2)
);
```

---

## 📚 Core Concepts & Usage

### 1. The Universal File System
The `FileSystem` abstraction allows you to write file logic that is agnostic of the underlying storage. This is a game-changer for testing.

**Implementations:**
*   `BunFileSystem`: Uses native Bun I/O.
*   `NodeFileSystem`: Uses Node `fs/promises`.
*   `MemoryFileSystem`: A complete virtual file system in RAM.

**Example: Streaming from Disk to Memory**
You can seamlessly pipe data between different file systems using `streamTo`.

```typescript
import { NodeFileSystem, MemoryFileSystem } from 'dm-std';

const disk = new NodeFileSystem();
const mem = new MemoryFileSystem();

// Recursively copy a real folder into the virtual memory FS
// Useful for loading assets into a test environment
await disk.streamTo('./src/assets', mem, '/virtual/assets');

const existsInMem = await mem.exist('/virtual/assets/logo.png'); // true
```

### 2. Robust Command Line Parsing
`CmdLine` handles complex argument parsing configurations with a simple declarative array.

**Features:**
*   **Multi-type support**: Allow an option to be a `string` OR `json`.
*   **Maps**: Restrict inputs to a specific whitelist (e.g., `prod`, `dev`).
*   **Deep Targeting**: specific arguments can populate nested objects (e.g., `--server-port` -> `{ server: { port: 80 } }`).

```typescript
import { CmdLine } from 'dm-std';

const options = CmdLine.Options.parse([
    {
        triggers: ['-m', '--mode'],
        type: 'string',
        map: { 
            'fast': 'MODE_FAST', // Maps input 'fast' to value 'MODE_FAST'
            'safe': 'MODE_SAFE' 
        },
        default: 'MODE_SAFE'
    },
    {
        triggers: ['--db'],
        type: 'json', // Parses input string directly into an object
        target: 'database.config' // Deep nesting in result
    },
    {
        triggers: ['--tags'],
        type: 'string',
        isArray: true // Collects multiple usages: --tags a --tags b
    }
]);

// Input: node app.js --mode fast --tags one --tags two --db '{"host":"localhost"}'
const result = CmdLine.parse(options, process.argv.slice(2));

/* Result:
{
    mode: 'MODE_FAST',
    database: { config: { host: 'localhost' } },
    tags: ['one', 'two']
}
*/
```

### 3. Predictable Math (`U8`, `U32`)
Standard JavaScript numbers are IEEE 754 floats. `dm-std` provides namespaces for integer arithmetic that clamps values instead of rolling over or returning Infinity.

*   **U8**: 0 to 255.
*   **U32**: 0 to 4,294,967,295.

**Integer Trigonometry:**
Functions like `sin`, `cos`, and `tan` in `U8` and `U32` map the input integer range to `0..2π` and return the result mapped back to the integer range.

```typescript
import { U8, U32 } from 'dm-std';

// Color Math (Safe Clamping)
const brightness = 200;
const boost = 100;
// Standard JS: 300 (Invalid color byte)
// U8: 255 (Clamped Max)
const final = U8.add(brightness, boost); 

// Integer Rotation
// U32.MAX represents a full 360deg rotation (2PI)
const angle = U32.MAX / 2; // ~PI (180 degrees)
const val = U32.sin(angle); // Returns result mapped to U32 range
```

---

## 📖 API Reference

### 📂 FileSystem
Interface `FileSystem_Interface`. Classes: `BunFileSystem`, `NodeFileSystem`, `MemoryFileSystem`.

| Method | Returns | Description |
| :--- | :--- | :--- |
| `readFile(path)` | `Promise<Buffer>` | Read file as buffer. |
| `writeFile(path, data)` | `Promise<boolean>` | Write buffer to file. Creates parent dirs. |
| `readFileAsText(path)` | `Promise<string>` | Read file as UTF-8 string. |
| `writeFileAsText(path, txt)` | `Promise<boolean>` | Write string to file. |
| `readFileAsJSON<T>(path)` | `Promise<T>` | Read and parse JSON. |
| `writeFileAsJSON(path, data)`| `Promise<boolean>` | Stringify and write JSON. |
| `createDir(path)` | `Promise<void>` | Create directory (recursive). |
| `copy(src, dest)` | `Promise<boolean>` | Recursive copy of files/folders. |
| `remove(path, recursive?)` | `Promise<boolean>` | Delete file or directory. |
| `streamTo(src, fs, dest)` | `Promise<boolean>` | Pipe data from **this** FS to **another** FS instance. |
| `exist(path)` | `Promise<boolean>` | Check existence. |
| `getSize(path)` | `Promise<number>` | Get size (bytes). Recursive for folders. |

---

### 💻 CmdLine

#### `CmdLine.parse(options, argv)`
Parses arguments based on the compiled options.
*   **options**: Result of `CmdLine.Options.parse([...])`.
*   **argv**: String array (usually `process.argv.slice(2)`).
*   **Returns**: `T` (result object) or `string` (error message).

#### `CmdLine.Option` Configuration
| Property | Type | Description |
| :--- | :--- | :--- |
| `triggers` | `string[]` | Flags to activate option (e.g., `['-f', '--force']`). |
| `type` | `string` \| `string[]` | `"integer"`, `"float"`, `"boolean"`, `"json"`, `"string"`, `"none"`. |
| `target` | `string` | Dot-notation path for result (e.g., `server.port`). |
| `isArray` | `boolean` | If true, values collect into an array. |
| `map` | `Object` | Whitelist valid inputs (e.g., `{ 'y': true, 'n': false }`). |
| `default` | `any` | Value used if trigger is missing. |

---

### 🔢 Numeric Types (`U8`, `U32`, `F64`)

**Common Methods:**
*   `add(a, b)`, `sub(a, b)`, `mul(a, b)`, `div(a, b)`: Clamped arithmetic.
*   `pow(base, exp)`: Power function.
*   `mod(a, b)`: Modulo.
*   `ter(a, b, c, d)`: Ternary (`if a <= b return c else d`).
*   `getRandom()`, `getRandomFromRange(min, max)`.

**Trigonometry (`U8`, `U32`):**
*   `sin(val)`, `cos(val)`, `tan(val)`: Input is normalized from type range (0..MAX) to (0..2π). Output is denormalized back to type range.

**Bitwise (`U8`, `U32`):**
*   `shl(a, b)`: Shift Left.
*   `shr(a, b)`: Logical Shift Right.

**Special `U32`:**
*   `setSeed(seed)`: Sets the seed for the internal pseudo-random number generator (Xorshift).

---

### 📝 String & Char (`Str`, `Char`)

**`Char.createList(chars)`**
Creates a boolean lookup map (`Record<string, boolean>`) from a string or array of strings. faster than `array.includes()`.

**`Str` Methods:**
*   `findChar(text, charList, start?)`: Find index of first char present in list.
*   `skipChar(text, charList, start?)`: Find index of first char **NOT** in list.
*   `findCharRev(...)` / `skipCharRev(...)`: Reverse search from end of string.
*   `isNotFound(pos)`: Returns true if index is -1.

---

### 🛠️ Utilities

*   **`Obj`**: Helpers for deep object manipulation (`get`, `set`, `clone`).
*   **`Err`**: Structured error object creation (`Err.create`, `Err.fromError`).
*   **`DateTime`**: Simple wrappers like `DateTime.now`.

---

## 📄 License

MIT License.
