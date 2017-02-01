
import {assert} from 'chai';

import * as ts from 'typescript';

suite("A", function() {
    test("a", function() {
        let {outputText, diagnostics} = f("let x = 3 + 2");
        assert.equal(diagnostics.length, 0);
    });
});


function f(input: string) {
    const diagnostics: ts.Diagnostic[] = [];

    const options: ts.CompilerOptions = ts.getDefaultCompilerOptions();

    options.isolatedModules = true;

    // transpileModule does not write anything to disk so there is no need to verify that there are no conflicts between input and output paths.
    options.suppressOutputPathCheck = true;

    // Filename can be non-ts file.
    options.allowNonTsExtensions = true;

    // We are not returning a sourceFile for lib file when asked by the program,
    // so pass --noLib to avoid reporting a file not found error.
    options.noLib = true;

    // Clear out other settings that would not be used in transpiling this module
    options.lib = undefined;
    options.types = undefined;
    options.noEmit = undefined;
    options.noEmitOnError = undefined;
    options.paths = undefined;
    options.rootDirs = undefined;
    options.declaration = undefined;
    options.declarationDir = undefined;
    options.out = undefined;
    options.outFile = undefined;

    // We are not doing a full typecheck, we are not resolving the whole context,
    // so pass --noResolve to avoid reporting missing file errors.
    options.noResolve = true;

    // if jsx is specified then treat file as .tsx
    const inputFileName = "module.ts";
    const sourceFile = ts.createSourceFile(inputFileName, input, options.target || ts.ScriptTarget.ES2015 );

    const newLine = (ts as any).getNewLineCharacter(options);

    // Output
    let outputText: string = '';
    let sourceMapText: string;

    // Create a compilerHost object to allow the compiler to read and write files
    const compilerHost: ts.CompilerHost = {
        getSourceFile: (fileName) => fileName === (ts as any).normalizePath(inputFileName) ? sourceFile : undefined!,
        writeFile: (name, text) => {
            if ((ts as any).fileExtensionIs(name, ".map")) {
                assert.notEqual(sourceMapText, undefined, `Unexpected multiple source map outputs for the file '${name}'`);
                sourceMapText = text;
            }
            else {
                assert.notEqual(outputText, undefined, `Unexpected multiple outputs for the file: '${name}'`);
                outputText = text;
            }
        },
        getDefaultLibFileName: () => "lib.d.ts",
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: fileName => fileName,
        getCurrentDirectory: () => "",
        getNewLine: () => newLine,
        fileExists: (fileName): boolean => fileName === inputFileName,
        readFile: () => "",
        directoryExists: () => true,
        getDirectories: () => []
    };

    const program = ts.createProgram([inputFileName], options, compilerHost);

        (ts as any).addRange(/*to*/ diagnostics, /*from*/ program.getSyntacticDiagnostics(sourceFile));
        (ts as any).addRange(/*to*/ diagnostics, /*from*/ program.getOptionsDiagnostics());
    // Emit
    program.emit();

    return {outputText, diagnostics}
}

/*
suite("A", function() {
   const a = [1, 2, 3];
   let i = 0;
   while (i < a.length) {
       (function(n) {
           test(`test ${n}`, function() {
              assert.equal(n + 1, a[n]);
           });
       })(i);
       ++i;
   }
});
*/