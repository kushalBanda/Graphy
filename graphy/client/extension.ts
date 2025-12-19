import * as vscode from 'vscode';
import { GenerateGraphyCommand } from './commands/GenerateGraphyCommand';

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ Graphy extension is now active!');

    // Register the generate graphy command with extension path
    const generateGraphyCommand = new GenerateGraphyCommand(context.extensionPath);
    const disposable = vscode.commands.registerCommand(
        'graphy.generateGraphy', 
        generateGraphyCommand.execute.bind(generateGraphyCommand)
    );

    context.subscriptions.push(disposable);

    // Show a notification that extension is loaded
    vscode.window.showInformationMessage('Graphy extension loaded! Use "Graphy: Generate Analysis" command.');
}

export function deactivate() {}