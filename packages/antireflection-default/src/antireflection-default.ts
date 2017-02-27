
import * as ar from 'antireflection';

declare module 'antireflection' {

    export interface T<N extends keyof TypeMap<PD>> extends Partial<CompositeObjectDescriptor> {
        defaultValue?: (TypeMap<TypeDescriptor>[N]) | (() => TypeMap<TypeDescriptor>[N]);
    }
}

export function create<P extends ar.Properties>(d: ar.OD<P>, o: ar.PartialObject<P>) {
    return ar.mapTarget(f, o, d);

    function f(args: ar.TargetMapperArgs): ar.Value {
        return args.v !== undefined ? args.v
            : typeof args.d.defaultValue === 'function' ? args.d.defaultValue()
            : args.d.defaultValue
        ;
    }
}
