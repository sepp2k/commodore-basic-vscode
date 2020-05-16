import * as vscode from 'vscode';
import {spawn} from 'child_process';

export function activate(context: vscode.ExtensionContext): void {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection();
    if (vscode.window.activeTextEditor) {
		analyze(vscode.window.activeTextEditor.document, diagnosticCollection);
	}
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		analyze(event.document, diagnosticCollection);
	}));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			analyze(editor.document, diagnosticCollection);
		}
	}));
}

function analyze(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
    if (document) {
		const executable = vscode.workspace.getConfiguration('basicv2').get("sabas64", "sabas64");
		const sabas = spawn(executable, ["--json"]);
		let stdout = "";
		sabas.stdout.on('data', data => stdout += data);
		sabas.stderr.on('data', data => console.log(data));
		sabas.on('close', _ => {
			const issues = JSON.parse(stdout) as Array<any>;
			collection.set(document.uri, issues.map(issue => {
				const line = issue.location.actualLine;
				const sc = issue.location.startColumn;
				const ec = issue.location.endColumn;
				const severity = issue.priority === "ERROR" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
				return new vscode.Diagnostic(
					new vscode.Range(new vscode.Position(line - 1, sc), new vscode.Position(line - 1, ec)),
					issue.message,
					severity
				);
			}));
		});
		sabas.stdin.write(document.getText());
		sabas.stdin.destroy();
	} else {
		collection.clear();
	}
}