import * as vscode from 'vscode';
import { GenerateGraphyCommand } from './commands/GenerateGraphyCommand';
import { disposeLineLens, registerLineLens } from './linelens/LineLens';

export function activate(context: vscode.ExtensionContext) {
    console.log('Graphy extension is now active!');

    const generateGraphyCommand = new GenerateGraphyCommand();
    const disposable = vscode.commands.registerCommand(
        'graphy.generateGraphy', 
        generateGraphyCommand.execute.bind(generateGraphyCommand)
    );

    context.subscriptions.push(disposable);
    vscode.window.showInformationMessage('Graphy extension loaded! Use "Graphy: Analyze Codebase" command.');

    registerLineLens(context);
}

export function deactivate() {
    disposeLineLens();
}
