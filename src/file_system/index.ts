// Export singleton instances
export { BunFileSystem } from './disk_bun';
export { NodeFileSystem } from './disk_node';
export { MemoryFileSystem } from './disk_memory';

// Export types and interfaces
export type {
    FileSystem_Interface,

    FileSystemNode,
    FileNode,
    DirectoryNode
} from './models';