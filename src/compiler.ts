import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as pug from "pug";



let compilerStatus: boolean = false;        //status of the compiler used to switch between the states
const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;      //filesystem path of the current workspace
let targetFolder: string = vscode.workspace.getConfiguration().get("livePugCompiler.savePath");  //get savePath from settings.json file or defaults to /Compiled-HTML
let fsEvent: vscode.Disposable;     //file system event for the compiler to auto compile on save


vscode.workspace.onDidChangeConfiguration(((e) => {
    /**
     * if the configuration is modified and also it affects the extension then modify the old configuration with the new configuration
     * else do nothing;
     */
    if (targetFolder !== "null" && e.affectsConfiguration("livePugCompiler.savePath")) {
        targetFolder = vscode.workspace.getConfiguration().get("livePugCompiler.savePath");
    }
}));

/**
 * 1.compile once
 * 2.set the listener to watch save event
 *      if file is saved and it is of jade type then compile it
 *      else do nothing
 * 3.set the compilerStatus to true
 */
export const startCompiler = () => {

    vscode.window.showInformationMessage("Pug Compiler Started");

    compileOnce();
    fsEvent = vscode.workspace.onDidSaveTextDocument((txDoc) => {
        if (txDoc.languageId === "jade") {
            compileToHTML(txDoc.uri);
        }
    });
    compilerStatus = true;

};

// dispose the listener and set compiler state to flase
export const stopCompiler = () => {

    vscode.window.showInformationMessage("Pug Compiler Stopped");

    fsEvent.dispose();
    compilerStatus = false;

};

// do the compilation only once
export const compileOnce = () => {

    // get all .pug files from the workspace
    vscode.workspace.findFiles("**/*.pug").then((files) => {
        files.forEach((file) => {
            compileToHTML(file);
        });
    });

};

// returns the state of the compiler
export const isCompilerActive = () => {
    return compilerStatus;
};

// compile and write to respective dirs
const compileToHTML = (file: vscode.Uri) => {

    const filename = path.basename(file.fsPath, ".pug");        //filename without extension eg: index.pug -> index
    const relativeDir = path.dirname(vscode.workspace.asRelativePath(file.fsPath)); //folder name relative to workspace eg: ${workspace}/app/index.pug -> app
    const fileDestination = path.join(workspaceRoot, targetFolder, relativeDir); //creating destination eg: ${workspace} + /Compiled-HTML + folder name
    const COMPILED_DATA = pug.renderFile(file.fsPath);      // Compile pug to  HTML format

    /**
     * if file destination not exists create it and save the data into it
     * else save directly into the dir
     */
    if (fs.existsSync(fileDestination) === false) {
        vscode.workspace.fs.createDirectory(vscode.Uri.file(fileDestination)).then(() => {
            fs.writeFileSync(path.join(fileDestination, `${filename}.html`), COMPILED_DATA);
        });
    } else {
        fs.writeFileSync(path.join(fileDestination, `${filename}.html`), COMPILED_DATA);
    }

};
