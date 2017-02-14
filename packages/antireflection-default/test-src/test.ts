
import {assert} from 'chai';

import * as ar from 'antireflection';
import * as ard from '../dist/antireflection-default'

const pointType = ar.object({
    x: {...ar.number, defaultValue: 0},
    y: {...ar.number, defaultValue: 0}
});

const circleType = ar.object({
    center: {...pointType, defaultValue: ard.init(pointType, {x: 1})},
    radius: ar.number
});

suite('A', function() {
    test('a', function() {
        const p1 = ard.init(pointType, {y: 2});
        assert.deepEqual(p1, {x: 0, y: 2});

        const c1 = ard.init(circleType, {radius: 2});
        assert.deepEqual(c1, {center: {x: 1, y: 0}, radius: 2});
    });
});

