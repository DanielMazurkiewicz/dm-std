import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Log } from '../log';
import type { FileSystem_Interface } from './models';

export class FileSystem_Node implements FileSystem_Interface {
    private logGroup: Log.Group.ID;

    constructor(logGroup?: Log.Group.ID) {
        this.logGroup = logGroup ?? Log.Group.preferred;
    }
    async createDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            Log.push(`Could not create directory ${dirPath}: ${String(error)}`, Log.ERROR, null, this.logGroup);
            throw error;
        }
    }

    async readDir(dirPath: string): Promise<string[]> {
        try {
            const entries = await fs.readdir(dirPath);
            return entries;
        } catch (error) {
            Log.push(`Could not read directory ${dirPath}: ${String(error)}`, Log.INFO, null, this.logGroup);
            throw error;
        }
    }

    async readFile(filePath: string): Promise<Buffer> {
        try {
            const data = await fs.readFile(filePath);
            return data;
        } catch (error) {
            Log.push(`Could not read file ${filePath}: ${String(error)}`, Log.INFO, null, this.logGroup);
            throw error;
        }
    }

    async writeFile(filePath: string, data: Buffer): Promise<boolean> {
        try {
            // Ensure directory exists
            await this.createDir(path.dirname(filePath));

            await fs.writeFile(filePath, data);
            return true;
        } catch (error) {
            Log.push(`Could not write file ${filePath}: ${String(error)}`);
            return false;
        }
    }

    async readFileAsText(filePath: string): Promise<string> {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return data;
        } catch (error) {
            Log.push(`Could not read file as text ${filePath}: ${String(error)}`, Log.INFO, null, this.logGroup);
            throw error;
        }
    }

    async readFileAsJSON<T>(filePath: string): Promise<T> {
        try {
            const text = await this.readFileAsText(filePath);
            return JSON.parse(text);
        } catch (error) {
            Log.push(`Could not read file as JSON ${filePath}: ${String(error)}`, Log.INFO, null, this.logGroup);
            throw error;
        }
    }

    async writeFileAsText(filePath: string, data: string): Promise<boolean> {
        try {
            await this.createDir(path.dirname(filePath));
            await fs.writeFile(filePath, data, 'utf-8');
            return true;
        } catch (error) {
            Log.push(`Could not write file ${filePath}: ${String(error)}`);
            return false;
        }
    }

    async writeFileAsJSON(filePath: string, data: any, formatted: boolean = false): Promise<boolean> {
        try {
            const content = formatted ? JSON.stringify(data, null, 4) : JSON.stringify(data);
            return await this.writeFileAsText(filePath, content);
        } catch (error) {
            Log.push(`Could not write file as JSON ${filePath}: ${String(error)}`, Log.INFO, null, this.logGroup);
            return false;
        }
    }

    async remove(path: string, recursive: boolean = true): Promise<boolean> {
        try {
            const stats = await fs.stat(path);
            if (stats.isDirectory()) {
                await fs.rm(path, { recursive });
            } else {
                await fs.unlink(path);
            }
            return true;
        } catch (error) {
            Log.push(`Could not remove ${path}: ${String(error)}`, Log.INFO, null, this.logGroup);
            return false;
        }
    }

    async copy(src: string | string[], dest: string, options?: { newName?: string }): Promise<boolean> {
        try {
            // Ensure destination directory exists
            await this.createDir(dest);

            const sources = Array.isArray(src) ? src : [src];

            for (const source of sources) {
                const stats = await fs.stat(source);
                const baseName = options?.newName || path.basename(source);
                const destPath = path.join(dest, baseName);

                if (stats.isFile()) {
                    await fs.copyFile(source, destPath);
                } else if (stats.isDirectory()) {
                    await this.copyDirectoryRecursive(source, destPath);
                }
            }

            return true;
        } catch (error) {
            Log.push(`Could not copy from ${Array.isArray(src) ? src.join(', ') : src} to ${dest}: ${String(error)}`, Log.INFO, null, this.logGroup);
            return false;
        }
    }

    private async copyDirectoryRecursive(src: string, dest: string): Promise<void> {
        await fs.mkdir(dest, { recursive: true });

        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectoryRecursive(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    async streamTo(src: string | string[], destFs: FileSystem_Interface, dest: string, options?: { newName?: string }): Promise<boolean> {
        try {
            // Ensure destination directory exists on destFs
            await destFs.createDir(dest);

            const sources = Array.isArray(src) ? src : [src];

            for (const source of sources) {
                const stats = await fs.stat(source);
                const baseName = options?.newName || path.basename(source);
                const destPath = destFs.join(dest, baseName);

                if (stats.isDirectory()) {
                    await this.streamDirectoryRecursive(source, destFs, destPath);
                } else if (stats.isFile()) {
                    const content = await this.readFile(source);
                    await destFs.writeFile(destPath, content);
                }
            }
            return true;
        } catch (error) {
            Log.push(`Could not stream from ${Array.isArray(src) ? src.join(', ') : src} to ${dest}: ${String(error)}`, Log.INFO, null, this.logGroup);
            return false;
        }
    }

    private async streamDirectoryRecursive(src: string, destFs: FileSystem_Interface, dest: string): Promise<void> {
        await destFs.createDir(dest);
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = destFs.join(dest, entry.name);

            if (entry.isDirectory()) {
                await this.streamDirectoryRecursive(srcPath, destFs, destPath);
            } else {
                const content = await this.readFile(srcPath);
                await destFs.writeFile(destPath, content);
            }
        }
    }

    async exist(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    async isFile(path: string): Promise<boolean> {
        try {
            const stats = await fs.stat(path);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    async isDirectory(path: string): Promise<boolean> {
        try {
            const stats = await fs.stat(path);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    async getSize(path: string): Promise<number> {
        try {
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

