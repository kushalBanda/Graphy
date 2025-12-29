import * as vscode from 'vscode';
import { GenerateLineTraceCommand } from './commands/GenerateLineTraceCommand';
import { disposeLineLens, registerLineLens } from './linelens/LineLens';

export function activate(context: vscode.ExtensionContext) {
    console.log('LineTrace extension is now active!');

    const generateLineTraceCommand = new GenerateLineTraceCommand();
    const disposable = vscode.commands.registerCommand(
        'linetrace.generateLineTrace', 
        generateLineTraceCommand.execute.bind(generateLineTraceCommand)
    );

    context.subscriptions.push(disposable);
    registerLineLens(context);
}

export function deactivate() {
    disposeLineLens();
}
