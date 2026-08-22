import * as vscode from 'vscode';
import { GenerateGraphyCommand } from './commands/GenerateGraphyCommand';
import { disposeLineLens, registerLineLens } from './linelens/LineLens';
import { registerLineRank } from './linelens/LineRankProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Graphy extension is now active!');

    const generateGraphyCommand = new GenerateGraphyCommand();
    const disposable = vscode.commands.registerCommand(
        'graphy.generateGraphy',
        generateGraphyCommand.execute.bind(generateGraphyCommand)
    );

    context.subscriptions.push(disposable);
    registerLineLens(context);
    registerLineRank(context);
}

export function deactivate() {
    disposeLineLens();
}
