
import * as ar from 'antireflection';
import * as arj from '../dist/antireflection-json';
import * as mm from 'moment';

declare module 'antireflection' {
    export interface TypeMap<D extends PD> {
        moment: mm.Moment;
    }
    export interface TypeDescriptorMap {
        moment: T<'moment'>;
    }
}

export const moment: ar.T<'moment'> = {
    t: 'moment', // must be the same as key that you add to TypeMap and TypeDescriptorMap
    check: (v: ar.Value, path: ar.Path) =>
         mm.isMoment(v) ? undefined
       : `${ar.pathMessage(path)}expected moment, got ${ar.typeofName(v)}`
    ,
    clone: (v: mm.Moment) => mm(v),
    toJSON: ({v}) => v.toJSON(),
    fromJSON: ({v}) => mm(new Date(v))
};

suite('M', function() {
    test('this is a test. ok.', function() {
    });
});