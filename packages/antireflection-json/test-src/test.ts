
import {assert} from 'chai';

import * as ar from 'antireflection';
import * as arj from '../dist/antireflection-json';
import * as arm from './antireflection-moment';
import * as moment from 'moment';

suite('A', function() {
    test('a', function() {

        const messageType = ar.object({
            text: ar.string,
            createdTime: ar.date
        });

        type Message = ar.Type<typeof messageType>;

        const m = {
            text: 'abc',
            createdTime: new Date(Date.UTC(2017, 1, 1, 2, 3, 4, 0)),
            extra: 'boo'
        };

        const json = arj.toJSON(messageType, m);

        assert.deepEqual(json, {text: 'abc', createdTime: '2017-02-01T02:03:04.000Z'});

        const rm: Message = arj.fromJSON(messageType, json);

        assert.deepEqual(rm, {text: m.text, createdTime: m.createdTime});

        const json2 = {text: 'm', createdTime: '2017-02-02T02:03:04.000Z'};
        const rm2 = arj.fromJSON(messageType, json2);
        json2.text = 'm2';
        assert.deepEqual(rm2, {text: 'm', createdTime: new Date(Date.UTC(2017, 1, 2, 2, 3, 4, 0))});

        const rm3 = arj.toJSON(messageType, rm2);
        rm2.text = 'm3';
        assert.deepEqual(rm3, {text: 'm', createdTime: '2017-02-02T02:03:04.000Z'});


        assert.deepEqual(arj.fromJSON(messageType, {text: '', createdTime: '2017-02-01T02:03:04.000Z'}), {text: '', createdTime: new Date('2017-02-01T02:03:04.000Z')});
        assert.deepEqual(arj.fromJSON(messageType, {text: '', createdTime: 1}), {text: '', createdTime: new Date(1)});
        assert.throw(() => arj.fromJSON(messageType, {text: '', createdTime: 'e'}), /^createdTime: invalid date: e$/);
        assert.throw(() => arj.fromJSON(messageType, {text: '', createdTime: {}}), /^createdTime: invalid date: \[object Object\]$/);

    });
});

suite('B', function() {
    test('b', function() {

        const messageType = ar.object({
            text: ar.string,
            createdTime: arm.moment
        });

        type Message = ar.Type<typeof messageType>;

        const m = {
            text: 'abc',
            createdTime: moment(Date.UTC(2017, 1, 1, 2, 3, 4, 0)),
            extra: 'stuff'
        };

        const json = arj.toJSON(messageType, m);

        assert.deepEqual(json, {text: 'abc', createdTime: '2017-02-01T02:03:04.000Z'});

        const rm: Message = arj.fromJSON(messageType, json);

        assert.deepEqual(Object.keys(rm), ['text', 'createdTime']);
        assert.equal(rm.text, m.text);
        assert.equal(rm.createdTime.valueOf(), m.createdTime.valueOf());

        const json2 = {text: 'm', createdTime: '2017-02-02T02:03:04.000Z'};
        const rm2 = arj.fromJSON(messageType, json2);
        json2.text = 'm2';

        assert.deepEqual(Object.keys(rm2), ['text', 'createdTime']);
        assert.equal(rm2.text, 'm');
        assert.equal(rm2.createdTime.valueOf(), moment(Date.UTC(2017, 1, 2, 2, 3, 4, 0).valueOf()));

        const rm3 = arj.toJSON(messageType, rm2);
        rm2.text = 'm3';
        assert.deepEqual(rm3, {text: 'm', createdTime: '2017-02-02T02:03:04.000Z'});

    });
});

