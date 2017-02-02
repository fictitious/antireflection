
import {assert} from 'chai';

import * as ts from 'typescript';
import {createHost} from 'ts-test-host';

declare  var console: any;

suite("A", function() {
    test("a", function() {


        const tsconfig = {
            "extends": "../../tsconfig.base.json",
            "files": [
                "../../node_modules/typescript/lib/lib.es5.d.ts",
                "../../node_modules/typescript/lib/lib.es2015.core.d.ts"
            ]
        };
        const host = createHost({/*tsconfig*/});
        const dd = host.compile('let x = z + 2');
        dd.forEach(d => {
            console.log(ts.flattenDiagnosticMessageText(d.messageText, ts.sys.newLine));
            console.dir(d);
        });
        assert.equal(dd.length, 0);
    });
});



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