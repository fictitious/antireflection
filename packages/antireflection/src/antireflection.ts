
export interface TypeMap<D extends PD> {
    string: string;
    number: number;
    object: O<D['_p'][0]>;
    array: PT<D['d']>[];
    optional: PT<D['d']> | undefined;
}

export interface PropertyDescriptor {
    t: keyof TypeMap<PD>;
}

// implementation type. must have all the properties used in TypeMap to index D type.
export interface PD extends PropertyDescriptor {
    _p: Properties[];
    d: PropertyDescriptor;
}

// type of the property described by D
export type PT<D extends PropertyDescriptor> = TypeMap<D>[D['t']];

// set of properties, each with a name and property descriptor
export type Properties = {
    [N in string]: PropertyDescriptor;
};

// type of the object defined by a set of properties P
export type O<P extends Properties> = {[N in keyof P]: PT<P[N]>}

// property descriptors for types in keyof TypeMap here
export const string: {t: 'string'} = {t:'string'};
export const number: {t: 'number'} = {t:'number'};
export function object<P extends Properties>(p: () => P): {t: 'object'; p: () => P; _p: P[]} {return {t:'object', p: p, _p: []}}
export function optional<D extends PropertyDescriptor>(d: D): {t: 'optional', d: D} {return {t:'optional', d: d}}
export function array<D extends PropertyDescriptor>(d: D): {t: 'array', d: D} { return {t: 'array', d: d}}



