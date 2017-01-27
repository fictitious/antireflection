
export interface PropertyTypes<P extends Properties> {
    number: number;
    string: string;
    object: ObjectType<P>;
    array: ObjectType<P>[];
}

export type PropertyType = keyof PropertyTypes<{}>;

export type PropertyOptional = 'no' | 'yes';

export interface PropertyDescriptor {
    type: PropertyType;
    optional: PropertyOptional;
}

export type Properties = {[N in string]: PropertyDescriptor};

export type ObjectType<P extends Properties> = {[N in keyof P]: TypeSelector<P[N]['p']>[P[N]['optional']][P[N]['type']]};

export type TypeSelector<P extends Properties> = {
    no: RequiredTypeSelector<P>;
    yes: OptionalTypeSelector<P>;
}

export type RequiredTypeSelector<P extends Properties> = {[N in PropertyType]: PropertyTypes<P>[N]};
export type OptionalTypeSelector<P extends Properties> = {[N in PropertyType]: PropertyTypes<P>[N] | undefined };

export type ObjectPropertyType<P extends Properties> = {type: 'object'; optional: 'no'; objectType: () => P; p: P};
export type OptionalObjectPropertyType<P extends Properties> = {type: 'object'; optional: 'yes'; objectType: () => P; p: P};
export type ArrayPropertyType<P extends Properties> = {type: 'array'; optional: 'no'; objectType: () => P; p: P};
export type OptionalArrayPropertyType<P extends Properties> = {type: 'array'; optional: 'yes'; objectType: () => P; p: P};

export const string:  {type: 'string'; optional: 'no'} = {type: 'string', optional: 'no'};
export const optionalString: {type: 'string'; optional: 'yes'} = {type: 'string', optional: 'yes'};
export const number: {type: 'number'; optional: 'no'} = {type: 'number', optional: 'no'};
export const optionalNumber: {type: 'number'; optional: 'yes'} = {type: 'number', optional: 'yes'};
export function object<P extends Properties>(p: () => P): ObjectPropertyType<P> {
    return {type: 'object', optional: 'no', objectType: p, p: null! as P};
}
export function optionalObject<P extends Properties>(p: () => P): OptionalObjectPropertyType<P> {
    return {type: 'object', optional: 'yes', objectType: p, p: null! as P};
}
export function array<P extends Properties>(p: () => P): ArrayPropertyType<P> {
    return {type: 'array', optional: 'no', objectType: p, p: null! as P};
}
export function optionalArray<P extends Properties>(p: () => P): OptionalArrayPropertyType<P> {
    return {type: 'array', optional: 'yes', objectType: p, p: null! as P};
}

export function interfaceType<P extends Properties>(p: P): ObjectType<P> {
    return null! as ObjectType<P>;
}

export function fun<P extends Properties, R>(p: P, fn: (o: ObjectType<P>) => R): (o: ObjectType<P>) => R { return o => fn(o) }
export function fun1<P extends Properties, R, A1>(p: P, fn: (o: ObjectType<P>, a1: A1) => R): (o: ObjectType<P>, a1: A1) => R { return (o, a1) => fn(o, a1) }
//export function fun(p: any, fn: any, ...args: any[]) { return fn.apply(null, args) }



