import * as ts from 'typescript';

interface SourceText {
    text: string;
    sourceFile?: ts.SourceFile;
}

export type DiagnosticType = 'option' | 'global' | 'syntactic' | 'semantic' | 'declaration';

export interface Diagnostic extends ts.Diagnostic {
    diagnosticType: DiagnosticType;
}

export interface CompileResult {
    diagnostics: Diagnostic[];
    program: ts.Program;
    sourceFile?: ts.SourceFile;
    formatDiagnostic(d: ts.Diagnostic): string;
    getSourceFileNames(): string[];
    getSourceFile(name: string): ts.SourceFile;
}


export interface Compiler {
    compile(source: string, onWrite?: (name: string, text: string) => void): CompileResult;
    parse(source: string): CompileResult;
}
export interface CreateCompiler {
    tsconfig?: any;
    basePath?: string; // for resolving relative paths in tsconfig. default is cwd()
    defaultLibFileName?: string;
    defaultLibLocation?: string;
}
export function createCompiler({
    tsconfig,
    basePath,
    defaultLibFileName,
    defaultLibLocation
}: CreateCompiler): Compiler {
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
            permanentSourceFiles.set(fileName, sourceFile);
        }
        return sourceFile;
    }

    function getSourceFile(sourceTexts: Map<string, SourceText>, fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
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
            getDefaultLibFileName: () => `${defaultLibLocation ? `${defaultLibLocation}/` : ''}${defaultLibFileName || 'lib.d.ts'}`,
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

    function formatDiagnostic(d: ts.Diagnostic, sourceText: SourceText): string {
        let fileName = '';
        let lineCol = '';
        if (d.file) {
            fileName = d.file === sourceText.sourceFile ? '<source>' : d.file.fileName;
            if (d.start >= 0) {
                const p = d.file.getLineAndCharacterOfPosition(d.start);
                lineCol = `(${p.line + 1},${p.character + 1}): `;
            }
        }
        const category = ts.DiagnosticCategory[d.category];
        const message = ts.flattenDiagnosticMessageText(d.messageText, ts.sys.newLine);
        return `${fileName}${lineCol}${category} TS${d.code}: ${message}`;
    }

    interface GetProgramDiagnostics {
        program: ts.Program;
        sourceFile?: ts.SourceFile;
        parseOnly: boolean;
    }
    function getProgramDiagnostics({program, sourceFile, parseOnly}: GetProgramDiagnostics): Diagnostic[] {
        let diagnostics: Diagnostic[] = [...program.getOptionsDiagnostics().map((d): Diagnostic => ({...d, diagnosticType: 'option'}))];
        if (!parseOnly) {
            diagnostics.push(...program.getGlobalDiagnostics().map((d): Diagnostic => ({...d, diagnosticType: 'global'})));
        }
        if (sourceFile) {
            diagnostics.push(...program.getSyntacticDiagnostics(sourceFile).map((d): Diagnostic => ({...d, diagnosticType: 'syntactic'})));
            if (!parseOnly) {
                diagnostics.push(...program.getSemanticDiagnostics(sourceFile).map((d): Diagnostic => ({...d, diagnosticType: 'semantic'})));
                diagnostics.push(...program.getDeclarationDiagnostics(sourceFile).map((d): Diagnostic => ({...d, diagnosticType: 'declaration'})));
            }
        }
        return diagnostics;
    }

    function getSourceFileNames(sourceTexts: Map<string, SourceText>): string[] {
        return [...sourceTexts.keys(), ...permanentSourceFiles.keys()];
    }

    interface CompileOneSource {
        source: string;
        onWrite?: (name: string, text: string) => void;
        parseOnly: boolean;
    }
    function compileOneSource({source, onWrite, parseOnly}: CompileOneSource): CompileResult {
        const sourceName = '$.ts';
        const sourceText: SourceText = {text: source};
        const sourceTexts: Map<string, SourceText> = new Map();
        sourceTexts.set(sourceName, sourceText);
        const program = ts.createProgram([...fileNames, sourceName], options, getCompilerHost(sourceTexts, onWrite));
        if (!parseOnly) {
            program.emit();
        }
        return {
            program,
            diagnostics: getProgramDiagnostics({program, sourceFile: sourceText.sourceFile, parseOnly}),
            sourceFile: sourceText.sourceFile,
            formatDiagnostic: (d: ts.Diagnostic) => formatDiagnostic(d, sourceText),
            getSourceFileNames: () => getSourceFileNames(sourceTexts),
            getSourceFile: (n: string) => getSourceFile(sourceTexts, n, options.target || ts.ScriptTarget.ES2015)
        };
    }

    function compile(source: string, onWrite?: (name: string, text: string) => void): CompileResult {
        return compileOneSource({source, onWrite, parseOnly: false});
    }

    function parse(source: string): CompileResult {
        return compileOneSource({source, parseOnly: true});
    }

    return {compile, parse};
}
