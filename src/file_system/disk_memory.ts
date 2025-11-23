import { Log } from '../log';
import type { FileSystem_Interface, FileSystemNode, DirectoryNode, FileNode } from './models';

export class FileSystem_Memory implements FileSystem_Interface {
    private root: DirectoryNode;
    private cwd: string;

    constructor() {
        this.root = {
            type: 'directory',
            name: '',
            children: new Map(),
            modified: new Date()
        };
        this.cwd = '/';
    }

    private resolvePath(filePath: string): { parent: DirectoryNode; name: string } | null {
        const parts = filePath.split('/').filter(p => p.length > 0);
        let current: DirectoryNode = this.root;

        if (parts.length === 0) {
            return { parent: current, name: '' };
        }

        for (let i = 0; i < parts.length - 1; i++) {
            const segment = parts[i]!;
            const child = current.children.get(segment);
            if (!child || child.type !== 'directory') {
                return null;
            }
            current = child;
        }

        return {
            parent: current,
            name: parts[parts.length - 1] || ''
        };
    }

    private getNode(filePath: string): FileSystemNode | null {
        const resolved = this.resolvePath(filePath);
        if (!resolved) return null;

        const { parent, name } = resolved;
        return parent.children.get(name) || null;
    }

    async createDir(dirPath: string): Promise<void> {
        if (!dirPath || dirPath === '.' || dirPath.length === 0) return;
        const parts = dirPath.split('/').filter(p => p.length > 0);
        let current: DirectoryNode = this.root;

        for (const part of parts) {
            let child = current.children.get(part);
            if (!child || child.type !== 'directory') {
                child = {
                    type: 'directory',
                    name: part,
                    children: new Map(),
                    modified: new Date()
                };
                current.children.set(part, child);
            }
            current = child;
        }

        Log.push(`Successfully created directory: ${dirPath}`, Log.DEBUG);
    }

    async readDir(dirPath: string): Promise<string[]> {
        const node = this.getNode(dirPath);
        if (!node || node.type !== 'directory') {
            throw new Error(`Directory not found: ${dirPath}`);
        }

        return Array.from(node.children.keys());
    }

    async readFile(filePath: string): Promise<Buffer> {
        const node = this.getNode(filePath);
        if (!node || node.type !== 'file') {
            throw new Error(`File not found: ${filePath}`);
        }

        Log.push(`Successfully read file: ${filePath}`, Log.DEBUG);
        return node.content;
    }

    async writeFile(filePath: string, data: Buffer): Promise<boolean> {
        try {
            // Ensure directory exists
            const parts = filePath.split('/').filter(p => p);
            const dirPath = parts.length <= 1 ? '/' : '/' + parts.slice(0, -1).join('/');
            await this.createDir(dirPath);

            const resolved = this.resolvePath(filePath);
            if (!resolved) {
                throw new Error(`Invalid path: ${filePath}`);
            }

            const { parent, name } = resolved;
            const fileNode: FileNode = {
                type: 'file',
                name,
                content: data,
                modified: new Date()
            };

            parent.children.set(name, fileNode);
            Log.push(`Successfully wrote file: ${filePath}`, Log.DEBUG);
            return true;
        } catch (error) {
            Log.push(`Could not write file ${filePath}: ${(error as Error).message}`, Log.ERROR);
            return false;
        }
    }

    async readFileAsText(filePath: string): Promise<string> {
        const node = this.getNode(filePath);
        if (!node || node.type !== 'file') {
            throw new Error(`File not found: ${filePath}`);
        }
        Log.push(`Successfully read file as text: ${filePath}`, Log.DEBUG);
        return node.content.toString('utf-8');
    }

    async readFileAsJSON<T>(filePath: string): Promise<T> {
        const text = await this.readFileAsText(filePath);
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Failed to parse JSON: ${e}`);
        }
    }

    async writeFileAsText(filePath: string, data: string): Promise<boolean> {
        return this.writeFile(filePath, Buffer.from(data, 'utf-8'));
    }

    async writeFileAsJSON(filePath: string, data: any, formatted: boolean = false): Promise<boolean> {
        const content = formatted ? JSON.stringify(data, null, 4) : JSON.stringify(data);
        return this.writeFileAsText(filePath, content);
    }

    async remove(path: string, recursive: boolean = true): Promise<boolean> {
        const resolved = this.resolvePath(path);
        if (!resolved) {
            Log.push(`Could not remove ${path}: path not found`, Log.WARN);
            return false;
        }

        const { parent, name } = resolved;
        const node = parent.children.get(name);

        if (!node) {
            Log.push(`Could not remove ${path}: path not found`, Log.WARN);
            return false;
        }

        if (node.type === 'directory') {
            if (!recursive && node.children.size > 0) {
                Log.push(`Could not remove directory ${path}: directory not empty`, Log.WARN);
                return false;
            }
            parent.children.delete(name);
            Log.push(`Successfully removed directory: ${path}`, Log.DEBUG);
        } else {
            parent.children.delete(name);
            Log.push(`Successfully removed file: ${path}`, Log.DEBUG);
        }

        return true;
    }

    async copy(src: string | string[], dest: string, options?: { newName?: string }): Promise<boolean> {
        try {
            // Ensure destination directory exists
            await this.createDir(dest);

            const sources = Array.isArray(src) ? src : [src];

            for (const source of sources) {
                const srcNode = this.getNode(source);
                if (!srcNode) {
                    throw new Error(`Source not found: ${source}`);
                }

                const baseName = options?.newName || srcNode.name;
                const destPath = this.join(dest, baseName);

                if (srcNode.type === 'file') {
                    await this.copyFileNode(srcNode, destPath);
                    Log.push(`Successfully copied file from ${source} to ${destPath}`, Log.DEBUG);
                } else if (srcNode.type === 'directory') {
                    await this.copyDirectoryRecursive(srcNode, destPath);
                    Log.push(`Successfully copied directory from ${source} to ${destPath}`, Log.DEBUG);
                }
            }

            return true;
        } catch (error) {
            Log.push(`Could not copy from ${Array.isArray(src) ? src.join(', ') : src} to ${dest}: ${(error as Error).message}`, Log.ERROR);
            return false;
        }
    }

    private async copyFileNode(srcNode: FileNode, destPath: string): Promise<void> {
        // Ensure destination directory exists
        const destDir = this.dirname(destPath);
        await this.createDir(destDir);

        const resolved = this.resolvePath(destPath);
        if (!resolved) {
            throw new Error(`Invalid destination path: ${destPath}`);
        }

        const { parent, name } = resolved;
        const destNode: FileNode = {
            type: 'file',
            name,
            content: Buffer.from(srcNode.content),
            modified: new Date()
        };

        parent.children.set(name, destNode);
    }

    private async copyDirectoryRecursive(srcNode: DirectoryNode, destPath: string): Promise<void> {
        await this.createDir(destPath);

        for (const [name, child] of srcNode.children) {
            const childDestPath = this.join(destPath, name);

            if (child.type === 'file') {
                await this.copyFileNode(child, childDestPath);
            } else if (child.type === 'directory') {
                await this.copyDirectoryRecursive(child, childDestPath);
            }
        }
    }

    async streamTo(src: string | string[], destFs: FileSystem_Interface, dest: string, options?: { newName?: string }): Promise<boolean> {
        try {
            // Ensure destination directory exists on destFs
            await destFs.createDir(dest);

            const sources = Array.isArray(src) ? src : [src];

            for (const source of sources) {
                const srcNode = this.getNode(source);
                if (!srcNode) {
                    throw new Error(`Source not found: ${source}`);
                }

                const baseName = options?.newName || srcNode.name;
                const destPath = destFs.join(dest, baseName);

                if (srcNode.type === 'directory') {
                    await this.streamDirectoryRecursive(srcNode, destFs, destPath);
                    Log.push(`Successfully streamed directory from ${source} to ${destPath}`, Log.DEBUG);
                } else {
                    const content = await this.readFile(source);
                    await destFs.writeFile(destPath, content);
                    Log.push(`Successfully streamed file from ${source} to ${destPath}`, Log.DEBUG);
                }
            }

            return true;
        } catch (error) {
            Log.push(`Could not stream from ${Array.isArray(src) ? src.join(', ') : src} to ${dest}: ${(error as Error).message}`, Log.ERROR);
            return false;
        }
    }

    private async streamDirectoryRecursive(srcNode: DirectoryNode, destFs: FileSystem_Interface, destPath: string): Promise<void> {
        await destFs.createDir(destPath);

        for (const [name, child] of srcNode.children) {
            const childDestPath = destFs.join(destPath, name);

            if (child.type === 'directory') {
                await this.streamDirectoryRecursive(child, destFs, childDestPath);
            } else {
                // child is FileNode
                const content = child.content; 
                await destFs.writeFile(childDestPath, content);
            }
        }
    }

    async exist(path: string): Promise<boolean> {
        const node = this.getNode(path);
        return node !== null;
    }

    async isFile(path: string): Promise<boolean> {
        const node = this.getNode(path);
        return node !== null && node.type === 'file';
    }

    async isDirectory(path: string): Promise<boolean> {
        const node = this.getNode(path);
        return node !== null && node.type === 'directory';
    }

    async getSize(path: string): Promise<number> {
        const node = this.getNode(path);
        if (!node) return 0;

        if (node.type === 'file') {
            return node.content.length;
        } else if (node.type === 'directory') {
            let totalSize = 0;

            const calculateDirSize = (dirNode: DirectoryNode): void => {
                dirNode.children.forEach((child) => {
                    if (child.type === 'file') {
                        totalSize += child.content.length;
                    } else if (child.type === 'directory') {
                        calculateDirSize(child);
                    }
                });
            };

            calculateDirSize(node);
            return totalSize;
        }

        return 0;
    }

    async fileExist(path: string | string[]): Promise<string | undefined> {
        const paths = Array.isArray(path) ? path : [path];
        for (const p of paths) {
            if (await this.exist(p) && await this.isFile(p)) {
                return p;
            }
        }
        return undefined;
    }

    getCwd(): string {
        return this.cwd;
    }

    setCwd(path: string): boolean {
        // Normalize the path
        const normalized = path.startsWith('/') ? path : this.join(this.cwd, path);
        // Check if the path exists and is a directory
        const node = this.getNode(normalized);
        if (node && node.type === 'directory') {
            this.cwd = normalized;
            return true;
        }
        return false;
    }

    isAbsolute(pathStr: string): boolean {
        return pathStr.startsWith('/');
    }

    join(...paths: string[]): string {
        const parts: string[] = [];
        for (const path of paths) {
            if (path) {
                parts.push(...path.split('/').filter(p => p));
            }
        }
        return '/' + parts.join('/');
    }

    dirname(pathStr: string): string {
        const parts = pathStr.split('/').filter(p => p);
        if (parts.length <= 1) return '/';
        parts.pop();
        return '/' + parts.join('/');
    }

    relative(from: string, to: string): string {
        const fromParts = from.split('/').filter(p => p);
        const toParts = to.split('/').filter(p => p);
        let common = 0;
        while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
            common++;
        }
        const up = fromParts.length - common;
        const down = toParts.slice(common);
        return '../'.repeat(up) + down.join('/');
    }
}

