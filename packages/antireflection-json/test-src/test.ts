
import {assert} from 'chai';

import * as ar from 'antireflection';
import * as arj from '../dist/antireflection-json';

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

    });
});
