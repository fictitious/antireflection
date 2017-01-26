
export interface PropertyTypes<PN extends string, P extends Properties<PN>> {
    number: number;
    string: string;
    object: ObjectType<PN, P>;
    array: ObjectType<PN, P>[];
}

export type PropertyType = keyof PropertyTypes<string, {}>;

export type PropertyOptional = 'no' | 'yes';

export interface PropertyDescriptor {
    type: PropertyType;
    optional: PropertyOptional;
}

export type Properties<PN extends string> = {[N in PN]: PropertyDescriptor};

export type ObjectType<PN extends string, P extends Properties<PN>> = {[N in keyof P]: TypeSelector<P[N]['pn'], P[N]['pt']>[P[N]['optional']][P[N]['type']]};

export type TypeSelector<PT extends PropertyType, P extends Properties<PT>> = {
    no: RequiredTypeSelector<PT, P>;
    yes: OptionalTypeSelector<PT, P>;
}

export type RequiredTypeSelector<PN extends PropertyType, P extends Properties<PN>> = {[N in PropertyType]: PropertyTypes<PN, P>[N]};
export type OptionalTypeSelector<PN extends PropertyType, P extends Properties<PN>> = {[N in PropertyType]: PropertyTypes<PN, P>[N] | undefined };

export type ObjectPropertyType<PN extends string, P extends Properties<PN>> = {type: 'object'; optional: PropertyOptional; objectType: () => P; pn: PN; p: P};
export type ArrayPropertyType<PN extends string, P extends Properties<PN>> = {type: 'array'; optional: PropertyOptional; objectType: () => P; pn: PN; p: P};

export const string:  PropertyDescriptor = {type: 'string', optional: 'no'};
export const optionalString: PropertyDescriptor = {type: 'string', optional: 'yes'};
export const number: PropertyDescriptor = {type: 'number', optional: 'no'};
export const optionalNumber: PropertyDescriptor = {type: 'number', optional: 'yes'};
export function object<PN extends string, P extends Properties<PN>>(p: () => P): ObjectPropertyType<PN, P> {
    return {type: 'object', optional: 'no', objectType: p, pn: null! as PN, p: null! as P};
}
export function optionalObject<PN extends string, P extends Properties<PN>>(p: () => P): ObjectPropertyType<PN, P> {
    return {type: 'object', optional: 'yes', objectType: p, pn: null! as PN, p: null! as P};
}
export function array<PN extends string, P extends Properties<PN>>(p: () => P): ArrayPropertyType<PN, P> {
    return {type: 'array', optional: 'no', objectType: p, pn: null! as PN, p: null! as P};
}
export function optionalArray<PN extends string, P extends Properties<PN>>(p: () => P): ArrayPropertyType<PN, P> {
    return {type: 'array', optional: 'yes', objectType: p, pn: null! as PN, p: null! as P};
}

export function interfaceType<PN extends string, P extends Properties<PN>>(p: P): ObjectType<PN, P> {
    return null! as ObjectType<PN, P>;
}

export function fun<PN extends string, P extends Properties<PN>, R>(p: P, fn: (o: ObjectType<PN, P>) => R): (o: ObjectType<PN, P>) => R { return o => fn(o) }
export function fun1<PN extends string, P extends Properties<PN>, R, A1>(p: P, fn: (o: ObjectType<PN, P>, a1: A1) => R): (o: ObjectType<PN, P>, a1: A1) => R { return (o, a1) => fn(o, a1) }
//export function fun(p: any, fn: any, ...args: any[]) { return fn.apply(null, args) }



