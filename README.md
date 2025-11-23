
# dm-std

**A collection of zero-dependency, type-safe numeric and utility functions for TypeScript.**

`dm-std` brings the predictability of lower-level languages to TypeScript. It provides fixed-size numeric types with clamped arithmetic (`U8`, `U32`), a powerful declarative command-line parser, unified file system abstractions (Node, Bun, Memory), and high-performance string/object utilities.

It is designed for building tools, simulations, games, and CLIs where explicit data types, predictable math (no overflows/underflows), and cross-runtime compatibility are required.

## 🚀 Key Features

*   **🛡️ Clamped Numeric Types**: `U8`, `U32`, `F64` implementations that prevent overflow/underflow logic errors. Perfect for color math, health systems, or inventory management.
*   **💻 Robust CLI Parser**: A declarative parser supporting typed values (`int`, `float`, `bool`, `json`), array inputs, aliases, validation maps, and object targeting.
*   **💾 Universal File System**: Write code once and run it on **Bun**, **Node.js**, or in **Memory** (for testing). Includes helpers for JSON, text, recursive copying, and streaming.
*   **⚡ Fast String Parsing**: Low-level `findChar` / `skipChar` utilities using lookup tables for building performant custom parsers.
*   **📦 Object Helpers**: Safe deep `get`/`set` operations using dot-notation paths.
*   **✅ Zero Dependencies**: Lightweight and completely self-contained.

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
import { U8, CmdLine, Str, Char, BunFileSystem, NodeFileSystem } from 'dm-std';

// --- 1. Clamped Arithmetic (U8: 0-255) ---
U8.add(250, 20); // => 255 (Clamped at MAX, no rollover)
U8.sub(5, 10);   // => 0   (Clamped at MIN)
U8.div(100, 0);  // => 255 (Safe division)

// --- 2. Universal File System ---
// Switch implementation based on runtime, API stays the same
const fs = (process.isBun) ? BunFileSystem : NodeFileSystem;

await fs.writeFileAsJSON('config.json', { volume: 100 }, true); // Pretty print
const exists = await fs.exist('config.json');
await fs.copy('src_dir', 'backup_dir'); // Recursive copy

// --- 3. Fast String Scanning ---
const input = "key=value; type=u8";
const DELIMITERS = Char.createList('=; '); // O(1) lookup table

// Skip spaces to find start
const start = Str.skipChar(input, Char.createList(' '), 0);
// Find next delimiter
const end = Str.findChar(input, DELIMITERS, start); 

// --- 4. CLI Parsing ---
const args = CmdLine.parse(
    CmdLine.Options.parse([
        { triggers: ['-p', '--port'], type: 'integer', default: 8080 },
        { triggers: ['--dry-run'], type: 'none' } // Flag (boolean true if present)
    ]), 
    process.argv.slice(2)
);
```

---

## 📚 Usage Examples

### 1. The Universal File System
The `FileSystem` abstraction allows you to write file logic that works anywhere. This is particularly powerful for testing—you can run your logic against `MemoryFileSystem` in unit tests and `BunFileSystem` in production.

```typescript
import { BunFileSystem, MemoryFileSystem, type FileSystem_Interface } from 'dm-std';

async function createBackup(fs: FileSystem_Interface, source: string) {
    if (!await fs.exist(source)) {
        console.error("Source missing");
        return;
    }
    
    // Recursive copy, works for files or directories
    await fs.copy(source, './backup');
    
    // You can even stream between different file systems!
    // e.g. Stream from Disk to Memory for processing
    await fs.streamTo(source, MemoryFileSystem, '/virtual-backup');
}

// Run with Bun
await createBackup(BunFileSystem, './data');
```

### 2. Building a Robust CLI Tool
`CmdLine` handles complex argument parsing with a declarative configuration. It supports enforcing specific values via maps, parsing JSON arguments directly, and handling arrays.

```typescript
import { CmdLine } from 'dm-std';

const optionsRaw: CmdLine.Option[] = [
    {
        triggers: ['-m', '--mode'],
        type: 'string',
        // Only allow these specific values, mapping them to internal constants if needed
        map: {
            'fast': 'MODE_FAST',
            'safe': 'MODE_SAFE'
        },
        default: 'MODE_SAFE'
    },
    {
        triggers: ['-c', '--config'],
        type: 'json', // Parses input string as JSON
        description: 'Pass config object directly'
    },
    {
        triggers: ['--exclude'],
        type: 'string',
        isArray: true, // Allows: --exclude node_modules --exclude .git
        target: 'exclusions' // Renames property in result object
    }
];

// Pre-optimize options for faster parsing
const options = CmdLine.Options.parse(optionsRaw);

// Input: node tool.js --mode fast --exclude dist --exclude coverage -c '{"timeout": 500}'
const result = CmdLine.parse(options, process.argv.slice(2));

/* Result:
{
    mode: 'MODE_FAST',
    exclusions: ['dist', 'coverage'],
    config: { timeout: 500 }
}
*/
```

### 3. Numeric types with `U8` / `U32`
Standard JavaScript numbers are floats. `dm-std` types provide integer logic useful for game states, colors, or protocol buffers.

```typescript
import { U8, U32 } from 'dm-std';

// Color mixing (Safe from 0-255 overflow)
const r = 200;
const r_boost = 100;
const r_final = U8.add(r, r_boost); // 255 (not 300)

// Rotation Logic
// U32 maps the full 32-bit range to 0..2PI for trig functions
// This allows highly efficient integer-based rotation math.
const angle = U32.MAX / 2; // Equivalent to PI (180 degrees)
const val = U32.sin(angle); // ~0 (Center of sine wave mapped to U32)

// Random ranges
const damage = U8.getRandomFromRange(10, 20); // 10 to 19
```

---

## 📖 API Reference

### `CmdLine`
Namespace for command-line argument parsing.

#### `CmdLine.Option` Interface
| Property | Type | Description |
| :--- | :--- | :--- |
| `triggers` | `string[]` | Flags that trigger this option (e.g., `['-f', '--file']`). |
| `type` | `ValueType` \| `ValueType[]` | `"none"`, `"boolean"`, `"integer"`, `"float"`, `"json"`, `"string"`. |
| `target` | `string` | Property name in the result. Supports dot notation (e.g., `server.port`). |
| `isArray` | `boolean` | If true, values collect into an array. |
| `map` | `Record<string, any>` | Whitelist of allowed string inputs mapped to result values. |
| `default` | `any` | Value used if trigger is missing. |

#### `CmdLine.parse<T>(options, argv): T | string`
Parses arguments. Returns the result object `T` on success, or an error **string** on failure.

---

### `FileSystem` (`BunFileSystem`, `NodeFileSystem`, `MemoryFileSystem`)
All implementations adhere to the `FileSystem_Interface` interface.

**Core Methods:**
*   `readFile(path): Promise<Buffer>`
*   `writeFile(path, data): Promise<boolean>`
*   `createDir(path): Promise<void>`
*   `readDir(path): Promise<string[]>`
*   `remove(path, recursive?): Promise<boolean>`
*   `copy(src, dest, options?): Promise<boolean>` - Recursive copy.
*   `streamTo(src, destFs, destPath): Promise<boolean>` - Pipes data from one FS implementation to another.

**Helpers:**
*   `readFileAsText(path)` / `writeFileAsText(path, data)`
*   `readFileAsJSON<T>(path)` / `writeFileAsJSON(path, data, formatted?)`
*   `exist(path)` / `isFile(path)` / `isDirectory(path)`
*   `getSize(path)`
*   `join(...)`, `dirname(...)`, `relative(...)`

---

### Numeric Types (`U8`, `U32`, `F64`)

#### Common Features
*   **Clamped Arithmetic**: `add`, `sub`, `mul`, `div` (safe div by 0), `pow`. Results stay within type bounds.
*   **Bitwise**: `shl`, `shr`.
*   **Logic**: `ter(a, b, c, d)` (Ternary: if `a <= b` then `c` else `d`).
*   **Random**: `getRandom()` (full range), `getRandomFromRange(min, max)`.

#### `U8` (0 to 255)
*   `sin(val)`, `cos(val)`: Input is 0-255 mapped to 0-2π. Output is 0-255 mapped from -1..1.
*   `tan(val)`: Mapped similarly with safe bounds.
*   `log(val)`, `exp(val)`: Scaled to fit U8 range.

#### `U32` (0 to 4,294,967,295)
*   `setSeed(seed)`: Set seed for the internal PRNG (Xorshift).
*   Trigonometry inputs map `0..MAX` to `0..2π`.

---

### String Utilities (`Str`, `Char`)

#### `Char`
*   `createList(chars: string): Record<string, boolean>` - Creates a fast lookup map for characters.

#### `Str`
*   `findChar(text, charList, start?)`: Finds index of first matching char.
*   `skipChar(text, charList, start?)`: Finds index of first char **not** in the list.
*   `findCharRev` / `skipCharRev`: Reverse search.
*   `isNotFound(pos)`: Checks against `Str.NOT_FOUND`.

---

### `Obj`
*   `get(obj, path, default?)`: Safe access (e.g., `Obj.get(data, 'users[0].name')`).
*   `set(obj, path, value)`: Safe assignment, creating intermediate objects/arrays.
*   `clone<T>(obj)`: Deep copy.

---

## 📄 License
MIT License.
