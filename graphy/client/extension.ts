import * as vscode from 'vscode';
import { GenerateGraphyCommand } from './commands/GenerateGraphyCommand';

export function activate(context: vscode.ExtensionContext) {
    console.log('Graphy extension is now active!');

    const generateGraphyCommand = new GenerateGraphyCommand();
    const disposable = vscode.commands.registerCommand(
        'graphy.generateGraphy', 
        generateGraphyCommand.execute.bind(generateGraphyCommand)
    );

    context.subscriptions.push(disposable);
    vscode.window.showInformationMessage('Graphy extension loaded! Use "Graphy: Generate Analysis" command.');
}

export function deactivate() {}