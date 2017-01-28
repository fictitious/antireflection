
// why d2 is better than d
// error messages are better (marginally = it shows {t: 'string'} instead of {t: string[]})
// PropertyDescriptor is more understandable (no question why it has string[] instead of string
// PropertyDescriptor contains type name => easier to handle at runtime (t === 'string' instead of theWholeDescriptor === ar.string which may miss someone else's string
// all possible types are listed in one place => easier to handle (there can't be someone else's string, custom types are easier to find (look for all merged declarations of TypeMap))
// d has limitation on expressable property types because t must conform to {} | undefined as declared in PropertyDescriptor (no real effect though)

// why d is better than d2
// implementation code is shorter => easier to define custom type
// hard to find good name for EPropertyDescriptor in d2 (and it needs to be public together with PropertyDescriptor because TypeMap needs to be amenable)

// ? rename PropertyDescriptor -> PropertyDefinition ??
export interface TypeMap<D extends EPropertyDescriptor> {
    string: string;
    number: number;
    object: ObjectType<D['_p'][0]>;
    array: PropertyType<D['d']>[];
    optional: PropertyType<D['d']> | undefined;
}

export interface PropertyDescriptor {
    t: keyof TypeMap<EPropertyDescriptor>;
}
export interface EPropertyDescriptor extends PropertyDescriptor {
    _p: Properties[];
    d: PropertyDescriptor;
}

export type Properties = {
    [N in string]: PropertyDescriptor;
};
export type PropertyType<D extends PropertyDescriptor> = TypeMap<D>[D['t']];

const string: {t: 'string'} = {t:'string'};
const number: {t: 'number'} = {t:'number'};

function object<P extends Properties>(p: () => P): {t: 'object'; p: () => P; _p: P[]} {return {t:'object', p: p, _p: []}}
function optional<D extends PropertyDescriptor>(d: D): {t: 'optional', d: D} {return {t:'optional', d: d}}
function array<D extends PropertyDescriptor>(d: D): {t: 'array', d: D} { return {t: 'array', d: d}}

type ObjectType<P extends Properties> = {[N in keyof P]: PropertyType<P[N]>}

export interface TypeMap<D extends EPropertyDescriptor> {
    u: 's'
}
const u: {t: 'u'} = {t:'u'};


const ap = {a: string, b: number, u: u};
const bp = {s: string, a: object(() => ap)};
const cp = {c: optional(number)};
const dp = {aa: array(object(() => ap)), ss: array(array(string))};

type A = ObjectType<typeof ap>;
type B = ObjectType<typeof bp>;
type C = ObjectType<typeof cp>;
type D = ObjectType<typeof dp>;

let a: A = {a: '', b: 3, u: 's'};
let b: B = {s: '2', a: {a: '', b: 2, u: 's'}};
let c: C = {c: 3};

let d: D = {aa: [a], ss: [['e', '1'], ['b', '2']]};

type WithDefault<P extends Properties> = P & {[N in keyof P]: PropertyDescriptor & {defaultValue?: PropertyType<P[N]>}};

function i<P extends Properties>(p: WithDefault<P>, o: ObjectType<P>) {
    Object.keys(p).forEach(n => {const v = p[n].defaultValue; if(v !== undefined) o[n] = v});
}

const ep = {a: {...optional(string), defaultValue: '3'}};
type E = ObjectType<typeof ep>;

let e = i(ep, {a: undefined});

