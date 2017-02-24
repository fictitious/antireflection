
import * as ar from 'antireflection';
import validatejs = require('validate.js');

export interface ValidateDescriptor<D extends ar.TypeDescriptor> {
    validate?: (v: ar.Type<D>) => string[],
    constraint?: ValidateJS.Field
}

export type Validate<P extends ar.Properties> = P & {[N in keyof P]: ar.TypeDescriptor & ValidateDescriptor<P[N]>};

export function object<P extends ar.Properties>(p: Validate<P>): ar.OD<Validate<P>> {
    return {t:'object', p: () => p, _p: [], ...ar.objectMethods}
}

export function validate<D extends ar.TypeDescriptor>(d: D, v: ar.Type<D>): string[] {
    return ar.reduce<string[]>(f, v, [], d);

    function f(args: ar.ReducerArgs<string[]> & {d: ValidateDescriptor<ar.TypeDescriptor>}): string[] {
        const {v, d, r, path} = args;
        if (d.validate) {
            r.push(...d.validate(v).map(m => `${ar.pathMessage(path)}${m}`));
        }
        if (d.constraint) {
            // validate.d.ts shipped with validate.js does not work for module:commonjs
            const vm = (validatejs as any).single(v, d.constraint);
            if (vm) {
                r.push(...vm.map((m: string) => `${ar.pathMessage(path)}${m}`));
            }
        }
        return r;
    }
}
