import * as vscode from "vscode";
import { isCompilerActive, startCompiler, stopCompiler, compileOnce } from "./compiler";


export const activate = (context: vscode.ExtensionContext) => {

	vscode.commands.registerCommand("livePugCompiler.startCompiler", (args) => {
		startCompiler();
		statusBarItem.text = `$(debug-stop) Stop Pug Compiler`;
	});
	vscode.commands.registerCommand("livePugCompiler.stopCompiler", (args) => {
		stopCompiler();
		statusBarItem.text = `$(debug-start) Start Pug Compiler`;
	});
	vscode.commands.registerCommand("livePugCompiler.compileOnce", (args) => {
		compileOnce();
	});
	vscode.commands.registerCommand("livePugCompiler.toggleCompiler", (args) => {
		if (isCompilerActive()) {
			stopCompiler();
			statusBarItem.text = `$(debug-start) Start Pug Compiler`;
		} else {
			startCompiler();
			statusBarItem.text = `$(debug-stop) Stop Pug Compiler`;
		}
	});

	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
	statusBarItem.text = `$(eye) Start Pug Compiler`;
	statusBarItem.command = "livePugCompiler.toggleCompiler";
	statusBarItem.tooltip = "Click to start or stop the Pug Compiler";
	statusBarItem.show();

};
export const deactivate = () => {

};