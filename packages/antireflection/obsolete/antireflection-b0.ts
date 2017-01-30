
export interface RequiredTypeSelector<PN extends string, P extends Properties<PN>> {
    number: {type: number};
    string: {type: string};
    object: {type: ObjectType<PN, P>};
    array:  {type: ObjectType<PN, P>[]};
}
export interface OptionalTypeSelector<PN extends string, P extends Properties<PN>> {
    number: {type: number | undefined};
    string: {type: string | undefined};
    object: {type: ObjectType<PN, P> | undefined};
    array:  {type: ObjectType<PN, P>[] | undefined};
}

export interface TypeSelector<PN extends string, P extends Properties<PN>> {
    yes: OptionalTypeSelector<PN, P>;
    no: RequiredTypeSelector<PN, P>;
}

export interface PropertyTypeMap<PN extends string, P extends Properties<PN>> {
    number: number,
    string: string,
    object: ObjectType<PN, P>,
    array: ObjectType<PN, P>[]
}

export type PropertyType = keyof PropertyTypeMap<string, {}>;

export interface PropertyOptional { optional: 'no' | 'yes'}

export type NumberPropertyType = {type: 'number'; optional: 'no'};
export type OptionalNumberPropertyType = {type: 'number'; optional: 'yes'};
export type StringPropertyType = {type: 'string'; optional: 'no'; };
export type OptionalStringPropertyType = {type: 'string'; optional: 'yes'; };
export type ObjectPropertyType<PN extends string, P extends Properties<PN>> = {type: 'object'; optional: 'no'; objectType: () => P; pn: PN; p: P};
export type OptionalObjectPropertyType<PN extends string, P extends Properties<PN>> = {type: 'object'; optional: 'yes'; objectType: () => P; pn: PN; p: P};
export type ArrayPropertyType<PN extends string, P extends Properties<PN>> = {type: 'array'; optional: 'no'; objectType: () => P; pn: PN; p: P};
export type OptionalArrayPropertyType<PN extends string, P extends Properties<PN>> = {type: 'array'; optional: 'yes'; objectType: () => P; pn: PN; p: P};

export type Properties<PN extends string> = {[N in PN]: {type: PropertyType, optional: PropertyOptional['optional']}};

export type ObjectType<PN extends string, P extends Properties<PN>> = {[N in keyof P]: TypeSelector<P[N]['pn'], P[N]['pt']>[P[N]['optional']][P[N]['type']]['type']};

export const string:  StringPropertyType = {type: 'string', optional: 'no'};
export const optionalString: OptionalStringPropertyType = {type: 'string', optional: 'yes'};
export const number: NumberPropertyType = {type: 'number', optional: 'no'};
export const optionalNumber: OptionalNumberPropertyType = {type: 'number', optional: 'yes'};
export function object<PN extends string, P extends Properties<PN>>(p: () => P): ObjectPropertyType<PN, P> {
    return {type: 'object', optional: 'no', objectType: p, pn: null! as PN, p: null! as P};
}
export function optionalObject<PN extends string, P extends Properties<PN>>(p: () => P): OptionalObjectPropertyType<PN, P> {
    return {type: 'object', optional: 'yes', objectType: p, pn: null! as PN, p: null! as P};
}
export function array<PN extends string, P extends Properties<PN>>(p: () => P): ArrayPropertyType<PN, P> {
    return {type: 'array', optional: 'no', objectType: p, pn: null! as PN, p: null! as P};
}
export function optionalArray<PN extends string, P extends Properties<PN>>(p: () => P): OptionalArrayPropertyType<PN, P> {
    return {type: 'array', optional: 'yes', objectType: p, pn: null! as PN, p: null! as P};
}

export function interfaceType<PN extends string, P extends Properties<PN>>(p: P): ObjectType<PN, P> {
    return null! as ObjectType<PN, P>;
}

export function fun<PN extends string, P extends Properties<PN>, R>(p: P, fn: (o: ObjectType<PN, P>) => R): (o: ObjectType<PN, P>) => R { return o => fn(o) }
export function fun1<PN extends string, P extends Properties<PN>, R, A1>(p: P, fn: (o: ObjectType<PN, P>, a1: A1) => R): (o: ObjectType<PN, P>, a1: A1) => R { return (o, a1) => fn(o, a1) }
//export function fun(p: any, fn: any, ...args: any[]) { return fn.apply(null, args) }



