

import * as ar from './antireflection';

const personProperties = {
    firstName: ar.string,
    lastName: ar.optionalString,
    a: ar.object(() => aProperties)
};

const aProperties = {
    a: ar.string
};

const fullName = ar.fun(personProperties, o => `${o.firstName} ${o.lastName} ${o.a.a}`);

console.log(fullName({firstName: 'a',lastName: undefined, a: {a1: 'x'}}));

const personType = ar.interfaceType(personProperties);
type Person = typeof personType;

let m: Person = {firstName: 'a', lastName: 'b', a: {a: 'z'}};
let z: void;
m.firstName = 'q';
m.a.a = 2;

/*
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



interface X<T> {i: T};
interface Y<T> extends X<T> { z: X<T>['i']}


*/