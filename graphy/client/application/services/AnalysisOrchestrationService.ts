import { FilesystemAdapter } from '../../infrastructure/adapters/FilesystemAdapter';

export class AnalysisOrchestrationService {
    private filesystemAdapter: FilesystemAdapter;

    constructor() {
        this.filesystemAdapter = new FilesystemAdapter();
    }

    async execute(projectPath: string): Promise<any> {
        try {
            const result = await this.filesystemAdapter.analyzeProjectStructure(projectPath);
            return result;
        } catch (error) {
            console.error('Error during analysis:', error);
            throw error;
        }
    }
}