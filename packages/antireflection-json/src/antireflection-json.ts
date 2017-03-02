
import * as ar from 'antireflection';

declare module 'antireflection' {

    export interface T<N extends keyof TypeMap<PD>> extends Partial<CompositeObjectDescriptor> {
        toJSON?(args: SourceMapperArgs): Value;
        fromJSON?(ars: TargetMapperArgs): Value;
    }
}

export function toJSON<D extends ar.TypeDescriptor>(d: D, v: ar.Type<D>): ar.Value {
    return ar.mapSource(f, v, d);

    function f(args: ar.SourceMapperArgs): ar.Value {
        return args.d.t === 'date' ? args.v.toJSON()
             : args.d.toJSON ? args.d.toJSON(args)
             : args.v
        ;
    }
}

export function fromJSON<D extends ar.TypeDescriptor>(d: D, v: ar.Value): ar.Type<D> {
    return ar.mapTarget(f, v, d);

    function f(args: ar.TargetMapperArgs): ar.Value {
        return args.d.t === 'date' ? checkDate(new Date(args.v), args.v, args.path)
             : args.d.fromJSON ? args.d.fromJSON(args)
             : args.v
        ;
    }

    function checkDate(d: Date, v: ar.Value, path: ar.Path) {
        if (isNaN(d.getTime())) {
            throw new Error(`${ar.pathMessage(path)}invalid date: ${v}`);
        }
        return d;
    }
}