
import * as ar from 'antireflection';

export type DefaultValues<P extends ar.Properties> = P & {[N in keyof P]: ar.TypeDescriptor & {defaultValue?: ar.Type<P[N]>}};

export function init<P extends ar.Properties>(d: ar.OD<DefaultValues<P>> , o: ar.PartialObject<P>) {
    return ar.mapTarget(f, o, d);

    function f(args: ar.TargetMapperArgs & {d: ar.TypeDescriptor & {defaultValue?: ar.Value}}): ar.Value {
        return args.v !== undefined ? args.v : args.d.defaultValue;
    }
}