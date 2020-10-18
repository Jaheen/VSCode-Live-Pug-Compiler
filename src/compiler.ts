import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as pug from "pug";



// status of the compiler used to switch between the states
let compilerStatus: boolean     = false;

// filesystem path of the current workspace
const workspaceRoot             = vscode.workspace.workspaceFolders[0].uri.fsPath;

// get savePath from settings.json file or defaults to /Compiled-HTML
let targetFolder: string        = vscode.workspace.getConfiguration().get("livePugCompiler.savePath");

// get extension name from settings.json file or defaults to /Compiled-HTML
let targetExtension: string     = vscode.workspace.getConfiguration().get("livePugCompiler.saveExt");

// get compilation setting for helper files from settings.json file or defaults to /Compiled-HTML
let targetUScore: boolean       = vscode.workspace.getConfiguration().get("livePugCompiler.uScoreCompile");

// get root path to compile from settings.json file or defaults to /Compiled-HTML
let targetStartFolder: string   = vscode.workspace.getConfiguration().get("livePugCompiler.startFolder");

//file system event for the compiler to auto compile on save
let fsEvent: vscode.Disposable;


vscode.workspace.onDidChangeConfiguration(((e) => {
    /**
     * if the configuration is modified and also it affects the extension then modify the old configuration with the new configuration
     * else do nothing;
     */
    if (targetFolder !== "null" && e.affectsConfiguration("livePugCompiler.savePath")) {
        targetFolder = vscode.workspace.getConfiguration().get("livePugCompiler.savePath");
    }

    if (targetExtension !== "null" && e.affectsConfiguration("livePugCompiler.saveExt")) {
        targetExtension = vscode.workspace.getConfiguration().get("livePugCompiler.saveExt");
    }

    if ( e.affectsConfiguration("livePugCompiler.uScoreCompile")) {
        targetUScore = vscode.workspace.getConfiguration().get("livePugCompiler.uScoreCompile");
    }

    if (targetStartFolder !== "null" && e.affectsConfiguration("livePugCompiler.startFolder")) {
        targetStartFolder = vscode.workspace.getConfiguration().get("livePugCompiler.startFolder");
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
    targetExtension             = typeof targetExtension === 'string'? targetExtension: 'null';
    targetExtension             = targetExtension.length > 0? targetExtension: 'null';
    targetExtension             = targetExtension === 'null'? 'html': targetExtension;

    const filename              = path.basename( file.fsPath, ".pug" );
    let relativeDir             = path.dirname( vscode.workspace.asRelativePath( file.fsPath ));
    const COMPILED_DATA         = pug.renderFile( file.fsPath );


    if ( targetStartFolder.length > 0 ) {
        let original    = relativeDir.split('/');
        let start       = targetStartFolder.split('/');
        let exit        = new Array();

        if ( original.length > 0 ){
            var a       = true;
            var temp    = new Array();

            temp = new Array();
            for ( var key in original ) {
                if ( original[key].length > 0 )
                    { temp.push(original[key]); }
            }
            original = temp;

            temp = new Array();
            for ( var key in start ) {
                if ( start[key].length > 0 )
                    { temp.push(start[key]); }
            }
            start = temp;

            for ( var key in original ) {
                if ( a === false || typeof start[key] === 'undefined' || original[key] !== start[key] ) {
                    exit.push(original[key]);
                    a = false;
                }
            }

            relativeDir = exit.join('/');
        }
    }

    const fileDestination   = path.join( workspaceRoot, targetFolder, relativeDir );

    // Проверить файлы с нижним подчеркиванием
    if ( targetUScore || ( !targetUScore && filename.substr( 0, 1 ) != "_" )) {

        if ( fs.existsSync(fileDestination) === false ) {
            vscode.workspace.fs.createDirectory( vscode.Uri.file( fileDestination )).then(() => {
                fs.writeFileSync( path.join( fileDestination, `${filename}.${targetExtension}`), COMPILED_DATA );
            });
        }
        else {
            fs.writeFileSync( path.join( fileDestination, `${filename}.${targetExtension}` ), COMPILED_DATA );
        }
    }
};
