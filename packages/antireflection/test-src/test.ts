
import {assert} from 'chai';
import {createCompiler, CompileResult} from 'tsc-simple';

import * as ar from '../dist/antireflection';

const pointType = ar.object({
    x: ar.number,
    y: ar.number
});

const labeledPointType = ar.object({
    ...pointType.p(),
    label: ar.optional(ar.string)
});

const polygonType = ar.object({
    points: ar.array(pointType)
});

const circleType = ar.object({
    center: pointType,
    radius: ar.number
});

const lineSegmentType = ar.object({
    a: ar.objectF(pointType.p),
    b: ar.objectF(pointType.p)
});



type Point = ar.Type<typeof pointType>;
type LabeledPoint = ar.Type<typeof labeledPointType>;
type Polygon = ar.Type<typeof polygonType>;
type Circle = ar.Type<typeof circleType>;
type LineSegment = ar.Type<typeof lineSegmentType>;


suite('A', function() {
    test('a', function() {
        const p1: Point = {x: 1, y: 2};
        const p2: LabeledPoint = {x: 3, y: 3, label: 'z'};
        // you can't omit optional properties in the initializer. The workaround is to use ar.create:
        const p3: LabeledPoint = ar.create(labeledPointType, {x: 0, y: 0});
        assert.throw(() => ar.create(labeledPointType, {x: 0}), /^y: expected number, got undefined$/);
        assert.throw(() => ar.create(labeledPointType, {x: 1, y: 2, label: {}} as any as LabeledPoint), /^label\?: expected string, got object$/);
        const pdef = {x: 1, y: 2, label: 'o'};
        const p4: LabeledPoint = ar.create(labeledPointType, pdef);
        assert.deepEqual(p4, {x: 1, y: 2, label: 'o'});
        p4.label = '';
        assert.equal(pdef.label, 'o');

        const pp: Polygon = {points: [p1, p2]};
        const c: Circle = {center: p1, radius: 2};

        const clp1 = ar.typedClone(labeledPointType, ar.create(labeledPointType, p1));
        assert.deepEqual(clp1, {x: 1, y: 2, label: undefined});
        const clp2 = ar.typedClone(labeledPointType, p2);
        assert.deepEqual(clp2, {x: 3, y: 3, label: 'z'});

        const ls: LineSegment = {a: p1, b: p2};
        const cls = ar.typedClone(lineSegmentType, ls);
        assert.deepEqual(cls, {a: {x: 1, y: 2}, b: {x: 3, y: 3}});
        cls.a.y = 0;
        assert.deepEqual(cls, {a: {x: 1, y: 0}, b: {x: 3, y: 3}});
        assert.deepEqual(p1, {x: 1, y: 2});

        assert.deepEqual(p1, {x: 1, y: 2});
        assert.deepEqual(p2, {x: 3, y: 3, label: 'z'});
        assert.deepEqual(p3, {x: 0, y: 0, label: undefined});
        assert.deepEqual(pp, {points: [{x: 1, y: 2}, {x: 3, y: 3, label: 'z'}]});

        const clonedC = ar.typedClone(circleType, c);
        clonedC.center.x = 2;
        assert.deepEqual(c, {center: {x: 1, y: 2}, radius: 2});
        assert.deepEqual(clonedC, {center: {x: 2, y: 2}, radius: 2});

        const clonedPP = ar.typedClone(polygonType, pp);
        clonedPP.points.push({x: 5, y: 5});
        assert.deepEqual(pp, {points: [{x: 1, y: 2}, {x: 3, y: 3, label: 'z'}]});
        assert.deepEqual(clonedPP, {points: [{x: 1, y: 2}, {x: 3, y: 3}, {x: 5, y: 5}]}); // !! note: the label is gone from clonedPP.points[1]

        const cpp = ar.create(polygonType, {points: [{x:0, y:0}]});
        assert.deepEqual(cpp, {points: [{x:0, y:0}]});

        assert.throw(() => ar.typedClone(circleType, {} as Circle), /^center: expected object, got undefined$/);

    });

    test('b', function() {
        assert.deepEqual(ar.check(pointType, {x: 1, y: 2}), []);
        assert.deepEqual(ar.check(pointType, null), ['expected object, got null']);
        assert.deepEqual(ar.check(ar.optional(pointType), undefined), []);
        assert.deepEqual(ar.check(ar.optional(pointType), null), ['expected object, got null']);
        assert.deepEqual(ar.check(labeledPointType, {x: 4, y: 5}), []);
        assert.deepEqual(ar.check(labeledPointType, {x: 3, y: 1, label: 'x'}), []);

        assert.deepEqual(ar.check(circleType, {center: {x: 'a'}, radius: 3}),
            ['center.x: expected number, got string', 'center.y: expected number, got undefined']);
        assert.deepEqual(ar.check(polygonType, {points: [{x: 3, y: 'b'}, undefined]}),
            ['points[0].y: expected number, got string', 'points[1]: expected object, got undefined']);
        assert.deepEqual(ar.check(polygonType, {points: {}}), ['points: expected array, got object']);
        assert.deepEqual(ar.check(polygonType, {points: null}), ['points: expected array, got null']);
    });


    test('c', function() {

        function badMapper(badValue: {} | null | undefined) {
            return function(args: ar.TargetMapperArgs) {
                if (args.path.length > 0  && args.path[args.path.length - 1].name === 'center') {
                    args.mapped = true; return badValue;
                } else {
                    return args.v;
                }
            }
        }
        assert.throw(() => ar.mapTarget(badMapper({}), {center: {}}, circleType),
                        /^center.x: expected number, got undefined; center.y: expected number, got undefined$/);

        assert.throw(() => ar.mapTarget(badMapper(''), {center: {}}, circleType),
                        /^center: expected object, got string$/);

        assert.throw(() => ar.mapTarget(badMapper(undefined), {center: {}}, circleType),
                        /^center: expected object, got undefined$/);

        assert.throw(() => ar.mapTarget(badMapper(null), {center: {}}, circleType),
                        /^center: expected object, got null$/);

        assert.throw(() => ar.mapTarget(badMapper([]), {center: {}}, circleType),
                        /^center: expected object, got array$/);

        function targetMapper(c: Point) {
            return function(args: ar.TargetMapperArgs) {
                if (args.path.length > 0 && args.path[args.path.length - 1].name === 'center') {
                    args.mapped = true; return c;
                } else {
                    return args.v;
                }
            }
        }

        const mc1 = ar.mapTarget(targetMapper({x: 1, y: 4}), {center: {}, radius: 2}, circleType);
        assert.deepEqual(mc1, {center: {x: 1, y: 4}, radius: 2});

        const mc2 = ar.mapTarget(targetMapper({x: 0, y: 0}), {center: {x: 1, y: 1}, radius: 2}, circleType);
        assert.deepEqual(mc2, {center: {x: 0, y: 0}, radius: 2});

        function sourceMapper1(args: ar.SourceMapperArgs) {
            if (args.path.length > 0 && args.path[args.path.length - 1].name === 'center') {
                args.mappedDescriptor = polygonType; return {points: [args.v]};
            } else {
                return args.v;
            }
        }
        const c = {center: {x: 0, y: 0}, radius: 1};
        const mc3 = ar.mapSource(sourceMapper1, c, circleType);
        assert.deepEqual(mc3, {center: {points: [{x: 0, y: 0}   ]}, radius: 1});

        const a: string[] = [];
        ar.reduce((args: ar.ReducerArgs<null>) => { if (args.path.length > 0) a.push(args.path[args.path.length - 1].name) }, c, null, circleType);
        assert.deepEqual(a, ['center', 'x', 'y', 'radius']);
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
            const pointType = ar.object({
                x: ar.number,
                y: ar.number
            });
            const labeledPointType = ar.object({
                ...pointType.p(),
                label: ar.optional(ar.string)
            });
            const polygonType = ar.object({
                points: ar.array(pointType)
            });
            const circleType = ar.object({
                center: pointType,
                radius: ar.number
            });
            type Point = ar.Type<typeof pointType>;
            type LabeledPoint = ar.Type<typeof labeledPointType>;
            type Polygon = ar.Type<typeof polygonType>;
            type Circle = ar.Type<typeof circleType>;
        `;

        const r1 = compiler.compile(`${pre}
            const p1: Point = {x: 0, y: 'z'};
            const c1: Circle = {center: p1};
            const c2: Circle = {center: 1};
            const p2: Point = {a: 2};
            const p: Polygon = {points: [{x:0, y:'z'}]};
            const c3: Circle = {center: {x: 0, a: 'b'}, radius: 3};
            const p3: LabeledPoint = {x: 0, y: 0, label: {}};
            const p4: LabeledPoint = ar.create(labeledPointType, {x: '2'});
        `);
        checkSemanticOnly(r1);
        assert.lengthOf(r1.diagnostics, 8);
        const dd = r1.diagnostics.map(d => r1.formatDiagnostic(d));
        assert.match(dd[0], /Type 'string' is not assignable to type 'number'/);
        assert.match(dd[1], /Property 'radius' is missing in type '{ center: O<{ x: T<"number">; y: T<"number">; }>; }'/);
        assert.match(dd[2], /Type 'number' is not assignable to type 'O<{ x: T<"number">; y: T<"number">; }>'/);
        assert.match(dd[3], /Object literal may only specify known properties, and 'a' does not exist in type 'O<{ x: T<"number">; y: T<"number">; }>'./);
        assert.match(dd[4], /Type '{ x: number; y: string; }\[\]' is not assignable to type 'O<{ x: T<"number">; y: T<"number">; }>\[\]'./);
        assert.match(dd[5], /Type '{ center: { x: number; a: string; }; radius: number; }' is not assignable to type 'O<{ center: OD<{ x: T<"number">; y: T<"number">; }>; radius: T<"number">; }>/);
        assert.match(dd[6], /Type '{ x: number; y: number; label: \{\}; }' is not assignable to type 'O<{ label: OptD<T<"string">>; x: T<"number">; y: T<"number">; }>'./);
        assert.match(dd[7], /Argument of type '{ x: string; }' is not assignable to parameter of type 'PartialObject<{ label: OptD<T<"string">>; x: T<"number">; y: T<"number">; }>'/);
    });
});


