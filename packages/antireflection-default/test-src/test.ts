
import {assert} from 'chai';
import {createCompiler, CompileResult} from 'tsc-simple';

import * as ar from 'antireflection';
import * as ard from '../dist/antireflection-default';

declare function setTimeout(f:(() => void), n: number): void;

suite('A', function() {
    test('a', function() {

        const pointType = ar.object({
            x: {...ar.number, defaultValue: 0},
            y: {...ar.number, defaultValue: 0}
        });

        const circleType = ar.object({
            center: {...pointType, defaultValue: ard.create(pointType, {x: 1})},
            radius: ar.number
        });

        const messageType = ar.object({
            text: ar.string,
            createdTime: {...ar.date, defaultValue: () => new Date()}
        });


        const p1 = ard.create(pointType, {y: 2});
        assert.deepEqual(p1, {x: 0, y: 2});

        const c1 = ard.create(circleType, {radius: 2});
        assert.deepEqual(c1, {center: {x: 1, y: 0}, radius: 2});

        const m1 = ard.create(messageType, {text: 't1'});
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                const m2 = ard.create(messageType, {text: 't2'});
                assert.instanceOf(m1.createdTime, Date);
                assert.instanceOf(m1.createdTime, Date);
                assert.notEqual(m1.createdTime.getTime(), m2.createdTime.getTime());
                resolve();
            }, 2000);
        });
    });

    test('b', function() {

        const pointType = ard.object({
            x: {...ar.number, defaultValue: 0},
            y: {...ar.number, defaultValue: 0}
        });

        const circleType = ard.object({
            center: {...pointType, defaultValue: ard.create(pointType, {x: 1})},
            radius: ar.number
        });


        const p1 = ard.create(pointType, {y: 2});
        assert.deepEqual(p1, {x: 0, y: 2});

        const c1 = ard.create(circleType, {radius: 2});
        assert.deepEqual(c1, {center: {x: 1, y: 0}, radius: 2});
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
        const compiler = createCompiler({defaultLibLocation: '../../node_modules/typescript/lib'});

        const r1 = compiler.compile(`
            import * as ar from 'antireflection';
            import * as ard from './dist/antireflection-default';
            const pointType = ard.object({
                x: {...ar.number, defaultValue: 'z'},
                y: ar.number
            });
        `);

        checkSemanticOnly(r1);
        assert.lengthOf(r1.diagnostics, 1);
        assert.match(r1.formatDiagnostic(r1.diagnostics[0]), /Type '{ defaultValue: string; .* is not assignable to type '\(T<"object"> & { p: \(\) => Properties; _p: Properties\[\]; } & { defaultValue\?: number | \(\(\) => numb\.\.\./);

        const r2 = compiler.compile(`
            import * as ar from 'antireflection';
            import * as ard from './dist/antireflection-default';
            const pointType = ar.object({
                x: {...ar.number, defaultValue: 'z'},
                y: ar.number
            });
            const p = ard.create(pointType, {});
        `);

        checkSemanticOnly(r2);
        assert.lengthOf(r2.diagnostics, 1);
        assert.match(r2.formatDiagnostic(r2.diagnostics[0]), /Type '{ defaultValue: string; .* is not assignable to type '\(T<"object"> & { p: \(\) => Properties; _p: Properties\[\]; } & { defaultValue\?: number | \(\(\) => numb\.\.\./);

    });
});


