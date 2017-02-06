
import {assert} from 'chai';
import {createCompiler, CompileResult} from 'tsc-simple';

import * as ar from '../dist/antireflection';

const pointProperties = {
    x: ar.number,
    y: ar.number
};

const labeledPointProperties = {
    ...pointProperties,
    label: ar.optional(ar.string)
};

const polygonProperties = {
    points: ar.array(ar.object(() => pointProperties))
};

const circleProperties = {
    center: ar.object(() => pointProperties),
    radius: ar.number
};

type Point = ar.O<typeof pointProperties>;
type LabeledPoint = ar.O<typeof labeledPointProperties>;
type Polygon = ar.O<typeof polygonProperties>;
type Circle = ar.O<typeof circleProperties>;


suite('A', function() {
    test('a', function() {
        const p1: Point = {x: 1, y: 2};
        const p2: LabeledPoint = {x: 3, y: 3, label: 'z'};
        // you can't omit optional properties in the initializer. The workaround is to use ar.create:
    //    const p3: LabeledPoint = ar.create(labeledPointProperties, {x: 0, y: 0});
        const pp: Polygon = {points: [p1, p2]};
        const c: Circle = {center: p1, radius: 2};

        assert.deepEqual(p1, {x: 1, y: 2});
        assert.deepEqual(p2, {x: 3, y: 3, label: 'z'});
    //    assert.deepEqual(p3, {x: 0 , y: 0});
        assert.deepEqual(pp, {points: [{x: 1, y: 2}, {x: 3, y: 3, label: 'z'}]});
    });
});



function checkSemanticOnly(r: CompileResult): void {
    r.diagnostics.forEach(d => {
        if (d.diagnosticType !== 'semantic') {
            assert.isOk(false, `unexpected ${d.diagnosticType} error: ${r.formatDiagnostic(d)}`);
        }
    });
}

suite('B', function() {
    test('a', function() {

        const tsconfig = {
            "extends": "../../tsconfig.base.json",
            "files": [
                "../../node_modules/typescript/lib/lib.es5.d.ts",
                "../../node_modules/typescript/lib/lib.es2015.core.d.ts"
            ]
        };
        const compiler = createCompiler({tsconfig});

        const pre = `
            import * as ar from './dist/antireflection';
            const pointProperties = {
                x: ar.number,
                y: ar.number
            };
            const labeledPointProperties = {
                ...pointProperties,
                label: ar.optional(ar.string)
            };
            const polygonProperties = {
                points: ar.array(ar.object(() => pointProperties))
            };
            const circleProperties = {
                center: ar.object(() => pointProperties),
                radius: ar.number
            };
            type Point = ar.O<typeof pointProperties>;
            type LabeledPoint = ar.O<typeof labeledPointProperties>;
            type Polygon = ar.O<typeof polygonProperties>;
            type Circle = ar.O<typeof circleProperties>;
        `;

        const r1 = compiler.compile(`${pre}
            const p1: Point = {x: 0, y: 'z'};
            const c1: Circle = {center: p1};
            const c2: Circle = {center: 1};
        `);
        checkSemanticOnly(r1);
        assert.lengthOf(r1.diagnostics, 3);
        const dd = r1.diagnostics.map(d => r1.formatDiagnostic(d));
        assert.match(dd[0], /Type 'string' is not assignable to type 'number'/);
        assert.match(dd[1], /Property 'radius' is missing in type '{ center: O<{ x: { t: "number"; }; y: { t: "number"; }; }>; }'/);
        assert.match(dd[2], /Type 'number' is not assignable to type 'O<{ x: { t: "number"; }; y: { t: "number"; }; }>'/);

        // extra properties
        // option <>
        // array <>
        // object <>

    });
});


