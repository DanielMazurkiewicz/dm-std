// In-memory file system data models
export interface FileNode {
    type: 'file';
    name: string;
    content: Buffer;
    modified: Date;
}

export interface DirectoryNode {
    type: 'directory';
    name: string;
    children: Map<string, FileNode | DirectoryNode>;
    modified: Date;
}

export type FileSystemNode = FileNode | DirectoryNode;

// File system operation interfaces
export interface FileSystemOperations {
    // Directory operations
    createDir(dirPath: string): Promise<void>;
    readDir(dirPath: string): Promise<string[]>;

    // File operations
    readFile(filePath: string): Promise<Buffer>;
    writeFile(filePath: string, data: Buffer): Promise<boolean>;
    remove(path: string, recursive?: boolean): Promise<boolean>;
    copy(src: string | string[], dest: string, options?: { newName?: string }): Promise<boolean>;

    // Path checking operations
    exist(path: string): Promise<boolean>;
    isFile(path: string): Promise<boolean>;
    isDirectory(path: string): Promise<boolean>;
    getSize(path: string): Promise<number>;
    fileExist(path: string | string[]): Promise<string | undefined>;

    // Working directory operations
    getCwd(): string;
    setCwd(path: string): boolean;

    // Path operations
    isAbsolute(path: string): boolean;
    join(...paths: string[]): string;
    dirname(path: string): string;
    relative(from: string, to: string): string;
}

