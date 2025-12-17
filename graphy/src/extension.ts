import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('✅ Graphy extension is now active!');

	// Register the hello world command
	const disposable = vscode.commands.registerCommand('graphy.helloWorld', () => {
		console.log('Hello World command executed!');
		vscode.window.showErrorMessage('Hello World from Graphy!');
	});

	context.subscriptions.push(disposable);
	
	// Show a notification that extension is loaded
	vscode.window.showInformationMessage('Graphy extension loaded! Try "Hello World" command.');
}

export function deactivate() {}
