import * as ts from 'typescript';

declare var console: any;

interface SourceText {
    text: string;
    sourceFile?: ts.SourceFile;
}

export interface TestHost {
    compile(source: string, onWrite?: (name: string, text: string) => void): ts.Diagnostic[];
}
export interface CreateHost {
    tsconfig?: any;
    basePath?: string; // for resolving relative paths in tsconfig. default is cwd()
    defaultLibFileName?: string;
    defaultLibLocation?: string;
}
export function createHost({
    tsconfig,
    basePath,
    defaultLibFileName,
    defaultLibLocation
}: CreateHost): TestHost {
    let options: ts.CompilerOptions;
    let fileNames: string[] = [];

    if (tsconfig) {
        let diagnostics: ts.Diagnostic[];
        ({options, fileNames, errors: diagnostics} = ts.parseJsonConfigFileContent(tsconfig, ts.sys, basePath || ts.sys.getCurrentDirectory(), {}, '<tsconfig>'));
        if (diagnostics.length > 0) {
            throw new Error(diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ts.sys.newLine)).join(ts.sys.newLine));
        }
    } else {
        options = ts.getDefaultCompilerOptions();
    }

    const permanentSourceFiles: Map<string, ts.SourceFile> = new Map(); // assuming that files on disk don't change

    function getPermanentSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
        let sourceFile = permanentSourceFiles.get(fileName);
        if (!sourceFile) {
            let text = '';
            try {
                text = ts.sys.readFile(fileName);
            } catch(e) {
                if (onError) onError(e.message);
            }
            if (text === undefined) { // returned by sys.readFile when the file does not exist
                const message = `error reading file ${fileName}`;
                if (onError) {
                    onError(message);
                } else {
                    throw new Error(message);
                }
                text = '';
            }

            sourceFile = ts.createSourceFile(fileName, text, languageVersion);
        }
        return sourceFile;
    }

    function getSourceFile(sourceTexts: Map<string, SourceText>, fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
        console.log(`getSourceFile ${fileName}`);
        let sourceFile: ts.SourceFile;
        let sourceText = sourceTexts.get(fileName);
        if (sourceText !== undefined) {
            if (sourceText.sourceFile === undefined) {
                sourceText.sourceFile = ts.createSourceFile(fileName, sourceText.text, languageVersion);
            }
            sourceFile = sourceText.sourceFile;
        } else {
            sourceFile = getPermanentSourceFile(fileName, languageVersion, onError);
        }
        return sourceFile;
    }

    function readFile(sourceTexts: Map<string, SourceText>, fileName: string) {
        let text: string;
        const sourceText = sourceTexts.get(fileName);
        if (sourceText) {
            text = sourceText.text;
        } else {
            const sourceFile = permanentSourceFiles.get(fileName);
            if (sourceFile) {
                text = sourceFile.text;
            } else {
                text = ts.sys.readFile(fileName);
            }
        }
        return text;
    }

    function getCompilerHost(sourceTexts: Map<string, SourceText>, onWrite?: (name: string, text: string) => void): ts.CompilerHost {
        return {
            getSourceFile: (fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void) => getSourceFile(sourceTexts, fileName, languageVersion, onError),
            writeFile: (name, text): void => onWrite ? onWrite(name, text) : void 0,
            getDefaultLibFileName: () => defaultLibFileName || 'lib.d.ts',
            getDefaultLibLocation: defaultLibLocation ? (() => defaultLibLocation) : undefined,
            useCaseSensitiveFileNames: () =>  ts.sys.useCaseSensitiveFileNames,
            getCanonicalFileName: (fileName: string):string =>  ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
            getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
            getNewLine: () => ts.sys.newLine,
            fileExists: (fileName: string): boolean => sourceTexts.has(fileName) || permanentSourceFiles.has(fileName) || ts.sys.fileExists(fileName),
            readFile: (fileName: string) => readFile(sourceTexts, fileName),
            directoryExists: (directoryName) => ts.sys.directoryExists(directoryName),
            getDirectories: (path: string): string[] => ts.sys.getDirectories(path)
        }
    }

    function compile(source: string, onWrite?: (name: string, text: string) => void): ts.Diagnostic[] {
        const sourceName = '$.ts';
        const sourceText: SourceText = {text: source};
        const sourceTexts: Map<string, SourceText> = new Map();
        sourceTexts.set(sourceName, sourceText);
        const program = ts.createProgram([...fileNames, sourceName], options, getCompilerHost(sourceTexts, onWrite));
        program.emit();
        return [
            ... program.getOptionsDiagnostics(),
            ... program.getGlobalDiagnostics(),
            ... program.getSyntacticDiagnostics(sourceText.sourceFile),
            ... program.getSemanticDiagnostics(sourceText.sourceFile),
            ... program.getDeclarationDiagnostics(sourceText.sourceFile)
        ];
    }
    return {compile};
}
