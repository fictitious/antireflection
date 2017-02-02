
import * as ts from 'typescript';

import {assert} from 'chai';

import {createHost} from '../dist/ts-test-host';

declare var console: any;

suite("A", function() {

    const tsconfig = {
        "extends": "../../tsconfig.base.json",
        "files": [
            "../../node_modules/typescript/lib/lib.es5.d.ts",
            "../../node_modules/typescript/lib/lib.es2015.core.d.ts"
        ]
    };


    test("a", function() {

        const host = createHost({tsconfig});

        const out1: {[name: string]: string} = {};

        const dd1 = host.compile('let x = 3 + 2', (name, text) => {out1[name] = text});
        assert.deepEqual(dd1, []);
        assert.deepEqual(out1, {
            '$.js': 'var x = 3 + 2;\n',
            '$.d.ts': 'declare let x: number;\n'
        });

        // implement format message (see if sourceFile is in sourceTexts => ...
        // implement checkSemanticOnly filter w/assert on anything other than semantic
        // add test with empty tsconfig
        const dd2 = host.compile('let x = z + 2');
        dd2.forEach(d => {
            console.log(ts.flattenDiagnosticMessageText(d.messageText, ts.sys.newLine));
            console.dir(d);
        });

    });


});