
import {assert} from 'chai';

import * as ar from 'antireflection';
import * as arv from '../dist/antireflection-validate';

suite('A', function() {

    test('a', function() {

        const pointType = ar.object({x: ar.number, y: ar.number});
        const circleType = arv.object({center: pointType, radius: {...ar.number, validate: v => v < 0 ? [`invalid value: ${v}. must be non-negative`] : []}});

        const c1 = ar.create(circleType, {center: {x: 0, y: 0}, radius: 1});
        const c2 = ar.create(circleType, {center: {x: 0, y: 0}, radius: -1});

        assert.deepEqual(arv.validate(circleType, c1), []);
        assert.deepEqual(arv.validate(circleType, c2), ['radius: invalid value: -1. must be non-negative']);

//        const polygon1Type = {...ar.object({points: ar.array(pointType)}), validate: v => v.points.length < 3 ? [`invalid polygon: must have >2 points`] : []};
//        can't do it in 1 line because v implicitly has any type

        const polygonBareType = ar.object({points: ar.array(pointType)});
        type Polygon = ar.Type<typeof polygonBareType>;
        const polygonType = {...polygonBareType, validate: (v: Polygon) => v.points.length < 3 ? [`invalid polygon: must have >2 points`] : []};

        const polygon2Type = arv.object({points: {...ar.array(pointType), validate: v => v.length < 3 ? [`polygon must have >2 points`] : []}});

        assert.deepEqual(arv.validate(polygonBareType, {points: []}), []);
        assert.deepEqual(arv.validate(polygonType, {points: []}), ['invalid polygon: must have >2 points']);
        assert.deepEqual(arv.validate(polygon2Type, {points: []}), ['points: polygon must have >2 points']);

    });

    test('b', function() {
        const messageType = arv.object({
            text: {...ar.string, constraint: {presence: true}},
            to: {...ar.string, constraint: {presence: true, email: true}}
        });
        type Message = ar.Type<typeof messageType>;
        const m1: Message = {text: 'a', to: 'foo@bar.com'};
        const m2: Message = {text: '', to: 'e'};
        const m3: Message = {text: 'z', to: ''};

        assert.deepEqual(arv.validate(messageType, m1), []);
        assert.deepEqual(arv.validate(messageType, m2), [`text: can't be blank`, `to: is not a valid email`]);
        assert.deepEqual(arv.validate(messageType, m3), [`to: can't be blank`, `to: is not a valid email`]);
    });

});


// compile test: circle with validate: v => v.length ... - compiles ???