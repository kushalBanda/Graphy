export interface FileStructure {
    rootPath: string;
    files: string[];
    directories: string[];
    fileExtensions: { [key: string]: number };
    totalFiles: number;
    totalDirectories: number;
    structureTree: any;
}