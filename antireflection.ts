
export interface PropertyTypes<P extends Properties> {
    number: number;
    string: string;
    object: ObjectType<P>;
    array: ObjectType<P>[];

    'number?': number | undefined;
    'string?': string | undefined;
    'object?': ObjectType<P> | undefined;
    'array?': ObjectType<P>[] | undefined;
}

export type TypeName = keyof PropertyTypes<{}>;

export interface PropertyDescriptor {type: TypeName}

export type Properties = {[N in string]: PropertyDescriptor};

export type PT<P extends Properties, N extends keyof Properties> = PropertyTypes<P[N]['_p']>[P[N]['type']];

export type ObjectType<P extends Properties> = {[N in keyof P]: PT<P, N>};


export type ObjectPropertyDescriptor<P extends Properties> = {type: 'object'; objectType: () => P; _p: P;};
export type OptionalObjectPropertyDescriptor<P extends Properties> = {type: 'object?'; objectType: () => P; _p: P};
export type ArrayPropertyDescriptor<P extends Properties> = {type: 'array'; objectType: () => P; _p: P};
export type OptionalArrayPropertyDescriptor<P extends Properties> = {type: 'array?'; objectType: () => P; _p: P};

export const string: {type: 'string'} = {type: 'string'};
export const number: {type: 'number'} = {type: 'number'};
export function object<P extends Properties>(p: () => P): ObjectPropertyDescriptor<P> { return {type: 'object', objectType: p, _p: null! as P} }
export function array<P extends Properties>(p: () => P): ArrayPropertyDescriptor<P> { return {type: 'array', objectType: p, _p: null! as P} }

export const optionalString: {type: 'string?'} = {type: 'string?'};
export const optionalNumber: {type: 'number?'} = {type: 'number?'};
export function optionalObject<P extends Properties>(p: () => P): OptionalObjectPropertyDescriptor<P> { return {type: 'object?', objectType: p, _p: null! as P} }
export function optionalArray<P extends Properties>(p: () => P): OptionalArrayPropertyDescriptor<P> { return {type: 'array?', objectType: p, _p: null! as P} }




