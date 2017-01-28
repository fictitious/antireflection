export interface PropertyDescriptor {
    t:({} | undefined)[];
}
export type Properties = {
    [N in string]: PropertyDescriptor;
};
export type PropertyType<D extends PropertyDescriptor> = D['t'][0];


const string: {t: string[]} = {t:[]};
const number: {t: number[]} = {t:[]};
function object<P extends Properties>(p: () => P): {t: ObjectType<P>[]; p: () => P} {return {t:[], p: p}}
function optional<D extends PropertyDescriptor>(d: D): {t: (D['t'][0] | undefined)[], d: D} {return {t:[], d: d}}
function array<D extends PropertyDescriptor>(d: D): {t: PropertyType<D>[][], d: D} { return {t: [], d: d}}

type ObjectType<P extends Properties> = {[N in keyof P]: PropertyType<P[N]>}

type s = 's';
const u: {t: s[]} = {t:[]};

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
    Object.keys(p).forEach(n => o[n] = p[n].defaultValue);
}

const ep = {a: {...optional(string), defaultValue: '3'}};
type E = ObjectType<typeof ep>;

let e = i(ep, {a: undefined});

