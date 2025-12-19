import * as vscode from 'vscode';
import { AnalysisOrchestrationService } from '../application/services/AnalysisOrchestrationService';

export class GenerateGraphyCommand {
    private analysisService: AnalysisOrchestrationService;

    constructor(extensionPath: string) {
        this.analysisService = new AnalysisOrchestrationService(extensionPath);
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
                title: "Generating Graphy Analysis...",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Starting analysis", increment: 0 });

                const analysisResult = await this.analysisService.execute(projectPath);

                progress.report({ message: "Creating Graphy.md", increment: 50 });

                await this.createGraphyFile(analysisResult, projectPath);

                progress.report({ message: "Analysis complete!", increment: 100 });
            });

            vscode.window.showInformationMessage('Graphy analysis completed successfully!');
        } catch (error) {
            console.error('Error generating Graphy analysis:', error);
            vscode.window.showErrorMessage(`Error generating Graphy analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async createGraphyFile(analysisResult: any, projectPath: string): Promise<void> {   
        let markdownContent = `# Graphy Codebase Analysis\n\n`;
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

        const graphyFilePath = vscode.Uri.file(`${projectPath}/Graphy.md`);
        const encoder = new TextEncoder();
        const content = encoder.encode(markdownContent);

        await vscode.workspace.fs.writeFile(graphyFilePath, content);

        const doc = await vscode.workspace.openTextDocument(graphyFilePath);
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