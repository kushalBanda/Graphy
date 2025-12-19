import * as cp from 'child_process';
import * as path from 'path';
import { FileStructure } from '../../domain/entities/FileStructure';

export class FilesystemAdapter {
    async analyzeProjectStructure(projectPath: string): Promise<FileStructure> {
        return new Promise((resolve, reject) => {
            const extensionRoot = path.join(__dirname, '..');
            const pythonScriptPath = path.join(extensionRoot, 'server', 'main.py');
            const pythonExecutable =
                process.env.GRAPHY_PYTHON ||
                (process.platform === 'win32' ? 'python' : 'python3');
            const child = cp.spawn(pythonExecutable, [pythonScriptPath, projectPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: extensionRoot
            });

            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('error', (error) => {
                reject(new Error(`Failed to start Python: ${error.message}`));
            });

            child.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        if (result.error) {
                            reject(new Error(result.error));
                        } else {
                            const fileStructure: FileStructure = {
                                rootPath: result.root_path,
                                files: result.files,
                                directories: result.directories,
                                fileExtensions: result.file_extensions,
                                totalFiles: result.total_files,
                                totalDirectories: result.total_directories,
                                structureTree: result.structure_tree
                            };
                            resolve(fileStructure);
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse Python output: ${parseError}`));
                    }
                } else {
                    reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
                }
            });
        });
    }
}
