
import * as ar from 'antireflection';
import validatejs = require('validate.js');

declare module 'antireflection' {

    export interface T<N extends keyof TypeMap<PD>> extends Partial<CompositeObjectDescriptor> {
        validate?: (v: TypeMap<PD>[N]) => string[],
        constraint?: ValidateJS.Field
    }
}

export function validate<D extends ar.TypeDescriptor>(d: D, v: ar.Type<D>): string[] {
    return ar.reduce<string[]>(f, v, [], d);

    function f<N extends keyof ar.TypeMap<ar.PD>>(args: ar.TypedReducerArgs<N, string[]>): string[] {
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
