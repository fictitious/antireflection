

import * as ar from './antireflection';

const personProperties = {
    firstName: ar.string,
    lastName: ar.optionalString,
    a: ar.optionalObject(() => aProperties)
};

const aProperties = {
    a: ar.string
};

const fullName = ar.fun(personProperties, o => `${o.firstName} ${o.lastName}`);

console.log(fullName({firstName: 'a',lastName: undefined, a: {a: 'x'}}));



declare module './antireflection' {


    export interface PropertyTypes<PN extends string, P extends Properties<PN>> {
        boolean: boolean
    }

}

export type BooleanPropertyType = {type: 'boolean'; optional: 'no'};
export type OptionalBooleanPropertyType = {type: 'boolean'; optional: 'yes'};

export const boolean:  BooleanPropertyType = {type: 'boolean', optional: 'no'};
export const optionalBoolean: OptionalBooleanPropertyType = {type: 'boolean', optional: 'yes'};

const flaggedPersonProperties = {
    ... personProperties,
    flagged: boolean
};

const f = ar.fun1(flaggedPersonProperties,  (o, p: string) => o.flagged ? 'good' : 'bad');

f({firstName: 'p', lastName: 'q', a: undefined, flagged: false}, 'd');




