import * as path from 'node:path';
import { Log } from '../log';
import type { FileSystemOperations } from './models';

class BunFileSystemImpl implements FileSystemOperations {

    constructor() {
    }

    async createDir(dirPath: string): Promise<void> {
        try {
            await Bun.write(path.join(dirPath, '.gitkeep'), '');
            Log.push(`Successfully created directory: ${dirPath}`, Log.DEBUG);
        } catch (error) {
            Log.push(`Could not create directory ${dirPath}: ${String(error)}`, Log.ERROR);
            throw error;
        }
    }

    async readDir(dirPath: string): Promise<string[]> {
        try {
            // Use Node.js fs for directory reading since Bun doesn't have a direct equivalent
            const fs = await import('node:fs/promises');
            const entries = await fs.readdir(dirPath);
            return entries;
        } catch (error) {
            Log.push(`Could not read directory ${dirPath}: ${String(error)}`);
            throw error;
        }
    }

    async readFile(filePath: string): Promise<Buffer> {
        try {
            const file = Bun.file(filePath);
            const buffer = await file.arrayBuffer();
            Log.push(`Successfully read file: ${filePath}`, Log.DEBUG);
            return Buffer.from(buffer);
        } catch (error) {
            Log.push(`Could not read file ${filePath}: ${String(error)}`);
            throw error;
        }
    }

    async writeFile(filePath: string, data: Buffer): Promise<boolean> {
        try {
            // Ensure directory exists
            await this.createDir(path.dirname(filePath));

            await Bun.write(filePath, data);
            Log.push(`Successfully wrote file: ${filePath}`, Log.DEBUG);
            return true;
        } catch (error) {
            Log.push(`Could not write file ${filePath}: ${String(error)}`);
            return false;
        }
    }

    async remove(path: string, recursive: boolean = true): Promise<boolean> {
        try {
            // Check if it's a file or directory
            const isDir = await this.isDirectory(path);
            if (isDir) {
                // Bun doesn't have a direct rm function, so we'll use the shell
                const proc = Bun.spawn(['rm', recursive ? '-rf' : '-f', path], {
                    stdout: 'pipe',
                    stderr: 'pipe'
                });
                const exitCode = await proc.exited;
                if (exitCode === 0) {
                    Log.push(`Successfully removed: ${path}`, Log.DEBUG);
                    return true;
                } else {
                    Log.push(`Could not remove ${path}`, Log.WARN);
                    return false;
                }
            } else {
                // Remove file
                const proc = Bun.spawn(['rm', path], {
                    stdout: 'pipe',
                    stderr: 'pipe'
                });
                const exitCode = await proc.exited;
                if (exitCode === 0) {
                    Log.push(`Successfully removed file: ${path}`, Log.DEBUG);
                    return true;
                } else {
                    Log.push(`Could not remove file ${path}`, Log.WARN);
                    return false;
                }
            }
        } catch (error) {
            Log.push(`Could not remove ${path}: ${String(error)}`);
            return false;
        }
    }

    async copy(src: string | string[], dest: string, options?: { newName?: string }): Promise<boolean> {
        try {
            // Ensure destination directory exists
            await this.createDir(dest);

            const sources = Array.isArray(src) ? src : [src];

            for (const source of sources) {
                const baseName = options?.newName || path.basename(source);
                const destPath = path.join(dest, baseName);

                const isDir = await this.isDirectory(source);
                if (isDir) {
                    await this.copyDirectoryRecursive(source, destPath);
                    Log.push(`Successfully copied directory from ${source} to ${destPath}`, Log.DEBUG);
                } else {
                    const srcFile = Bun.file(source);
                    await Bun.write(destPath, srcFile);
                    Log.push(`Successfully copied file from ${source} to ${destPath}`, Log.DEBUG);
                }
            }

            return true;
        } catch (error) {
            Log.push(`Could not copy from ${Array.isArray(src) ? src.join(', ') : src} to ${dest}: ${String(error)}`);
            return false;
        }
    }

    private async copyDirectoryRecursive(src: string, dest: string): Promise<void> {
        await this.createDir(dest);

        const entries = await this.readDir(src);

        for (const entry of entries) {
            const srcPath = path.join(src, entry);
            const destPath = path.join(dest, entry);

            const isDir = await this.isDirectory(srcPath);
            if (isDir) {
                await this.copyDirectoryRecursive(srcPath, destPath);
            } else {
                const srcFile = Bun.file(srcPath);
                await Bun.write(destPath, srcFile);
            }
        }
    }

    async exist(path: string): Promise<boolean> {
        try {
            const file = Bun.file(path);
            await file.exists();
            return true;
        } catch {
            return false;
        }
    }

    async isFile(path: string): Promise<boolean> {
        try {
            const file = Bun.file(path);
            const exists = await file.exists();
            if (!exists) return false;

            // For Bun, we can check if it's readable as a file
            // This is a simplified check - in practice, you'd need more sophisticated logic
            return true;
        } catch {
            return false;
        }
    }

    async isDirectory(path: string): Promise<boolean> {
        try {
            // Use Node.js fs for directory checking since Bun doesn't have a direct equivalent
            const fs = await import('node:fs/promises');
            const stats = await fs.stat(path);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    async getSize(path: string): Promise<number> {
        try {
            const fs = await import('node:fs/promises');

            const stats = await fs.stat(path);
            if (stats.isFile()) {
                return stats.size;
            } else if (stats.isDirectory()) {
                let totalSize = 0;

                const calculateDirSize = async (dirPath: string): Promise<void> => {
                    const entries = await fs.readdir(dirPath, { withFileTypes: true });
                    for (const entry of entries) {
                        const fullPath = this.join(dirPath, entry.name);
                        if (entry.isFile()) {
                            const fileStats = await fs.stat(fullPath);
                            totalSize += fileStats.size;
                        } else if (entry.isDirectory()) {
                            await calculateDirSize(fullPath);
                        }
                    }
                };

                await calculateDirSize(path);
                return totalSize;
            }

            return 0;
        } catch {
            return 0;
        }
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
        return process.cwd();
    }

    setCwd(path: string): boolean {
        try {
            process.chdir(path);
            return true;
        } catch {
            return false;
        }
    }

    isAbsolute(pathStr: string): boolean {
        return path.isAbsolute(pathStr);
    }

    join(...paths: string[]): string {
        return path.join(...paths);
    }

    dirname(pathStr: string): string {
        return path.dirname(pathStr);
    }

    relative(from: string, to: string): string {
        return path.relative(from, to);
    }
}

export const BunFileSystem = new BunFileSystemImpl();