import * as vscode from 'vscode';
import { AnalysisOrchestrationService } from '../application/services/AnalysisOrchestrationService';

export class GenerateLineTraceCommand {
    private analysisService: AnalysisOrchestrationService;

    constructor() {
        this.analysisService = new AnalysisOrchestrationService();
    }

    async execute(): Promise<void> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder found. Please open a folder in VSCode.');
                return;
            }

            const projectPath = workspaceFolders[0].uri.fsPath;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating LineTrace Analysis...",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Starting analysis", increment: 0 });

                const analysisResult = await this.analysisService.execute(projectPath);

                progress.report({ message: "Creating LineTrace.md", increment: 50 });

                await this.createLineTraceFile(analysisResult, projectPath);

                progress.report({ message: "Analysis complete!", increment: 100 });
            });

            vscode.window.showInformationMessage('LineTrace analysis completed successfully!');
        } catch (error) {
            console.error('Error generating LineTrace analysis:', error);
            vscode.window.showErrorMessage(`Error generating LineTrace analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async createLineTraceFile(analysisResult: any, projectPath: string): Promise<void> {   
        let markdownContent = `# LineTrace Codebase Analysis\n\n`;
        markdownContent += `## Project: ${analysisResult.rootPath}\n\n`;

        markdownContent += `### File Structure Summary\n`;
        markdownContent += `- Total Files: ${analysisResult.totalFiles}\n`;
        markdownContent += `- Total Directories: ${analysisResult.totalDirectories}\n`;
        markdownContent += `- File Extensions: ${Object.entries(analysisResult.fileExtensions || {}).map(([ext, count]) => `${ext}: ${count}`).join(', ')}\n\n`;

        markdownContent += `### Directory Tree\n`;
        markdownContent += '```\n';
        markdownContent += this.formatTree(analysisResult.structureTree || {}, '', true);
        markdownContent += '```\n\n';

        markdownContent += `### File List\n`;
        const files = analysisResult.files || [];
        files.slice(0, 20).forEach((file: string) => {
            markdownContent += `- ${file}\n`;
        });

        if (files.length > 20) {
            markdownContent += `\n... and ${files.length - 20} more files\n`;
        }

        const lineTraceFilePath = vscode.Uri.file(`${projectPath}/LineTrace.md`);
        const encoder = new TextEncoder();
        const content = encoder.encode(markdownContent);

        await vscode.workspace.fs.writeFile(lineTraceFilePath, content);

        const doc = await vscode.workspace.openTextDocument(lineTraceFilePath);
        await vscode.window.showTextDocument(doc);
    }

    private formatTree(tree: any, prefix: string, isLast: boolean): string {
        let result = '';
        const keys = Object.keys(tree);

        keys.forEach((key, index) => {
            const isLastItem = index === keys.length - 1;
            const currentPrefix = prefix + (isLast ? ' ' : '│ ') + ' ';
            const connector = isLastItem ? '└── ' : '├── ';

            result += currentPrefix + connector + key + '\n';

            if (typeof tree[key] === 'object' && tree[key] !== null) {
                result += this.formatTree(tree[key], prefix + (isLast ? '   ' : '│  '), isLastItem);
            }
        });

        return result;
    }
}
