
export interface TypeMap<D extends PD> {
    string: string;
    number: number;
    object: O<D['_p'][0]>;
    array: PT<D['d']>[];
    optional: PT<D['d']> | undefined;
}

// implementation type.
// must have all the properties used in TypeMap to index D type,
// and must be assignable to PropertyDescriptor
export interface PD  {
    t: keyof TypeMap<PD>;
    _p: Properties[];
    d: PropertyDescriptor;
}

// type of the property described by D
export type PT<D extends PropertyDescriptor> = TypeMap<D>[D['t']];

// possible descriptor types
export interface T<N extends keyof TypeMap<PD>> {
    t: N;
    map<D extends PropertyDescriptor, RD extends PropertyDescriptor>(this: D, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D>, rd?: RD): PT<RD>;
}
export interface PropertyDescriptorMap {
    string: T<'string'>;
    number: T<'number'>;
    array: T<'array'> & {d: PropertyDescriptor};
    object: T<'object'> & {p: () => Properties; _p: Properties[]};
    optional: T<'optional'> & {d: PropertyDescriptor};
}
export type PropertyDescriptor = PropertyDescriptorMap[keyof PropertyDescriptorMap];

// set of properties, each with a name and property descriptor
export type Properties = {
    [N in string]: PropertyDescriptor;
};

// type of the object defined by a set of properties P
export type O<P extends Properties> = {[N in keyof P]: PT<P[N]>};

export interface PArr<D extends PropertyDescriptor> extends T<'array'> {
    d: D;
}
export interface PObj<P extends Properties> extends T<'object'> {
    p: () => P;
    _p: P[];
}
export interface POpt<D extends  PropertyDescriptor> extends T<'optional'> {
    d: D;
}

// property descriptors for types in keyof TypeMap here
export const string: T<'string'> = {t:'string', map: mapElement};
export const number: T<'number'> = {t:'number', map: mapElement};
export function object<P extends Properties>(p: () => P): PObj<P> {return {t:'object', p: p, _p: [], map: mapObject}}
export function optional<D extends PropertyDescriptor>(d: D): POpt<D> {return {t:'optional', d: d, map: mapOptional}}
export function array<D extends PropertyDescriptor>(d: D): PArr<D> { return {t: 'array', d: d, map: mapArray}}

function mapElement<D extends PropertyDescriptor, RD extends PropertyDescriptor>
  (this: D, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D>, rd?: RD): PT<RD> {
    return f(v, this, rd);
}
function mapOptional<D extends PropertyDescriptor, RD extends PropertyDescriptor>
  (this: POpt<D>, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D> | undefined, rd?: POpt<RD>): PT<RD> | undefined {
    return v === undefined ? undefined : this.d.map(f, v, rd && rd.d);
}
function mapObject<P extends Properties, RP extends Properties, D extends PropertyDescriptor, RD extends PropertyDescriptor>
  (this: PObj<P>, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: O<P>,  rd?: PObj<RP>): O<RP> {
    const props = this.p();
    const rprops = rd && rd.p();
    const r: O<RP> = {} as O<RP>;
    const keys = Object.keys(props);
    keys.forEach(k => {
        // is really right to include everything not in destination type? what if it has different shape: for example p['a'] is object and rp['a'] is array?

        // actually the real question is should it throw when asked to map a type into incompatible one?
        r[k] = props[k].map(f, v[k], rprops && rprops[k]);
    });
    return r;
}
function mapArray<D extends PropertyDescriptor, RD extends PropertyDescriptor>
(this: PArr<D>, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D>[], rd?: PArr<RD>): PT<RD>[] {
    return v.map(e => this.d.map(f, e, rd && rd.d));
}



export type OptionalObject<P extends Properties> = {[N in keyof P]?: PT<P[N]>};

// NOTE: everything in o not described in p will be trimmed out
export function typedClone<P extends Properties>(p: P, o: O<P>): O<P> {
    const pp: PObj<P> = {t: 'object', p: () => p, _p:[], map: mapObject};
    return pp.map(<T>(i: T) => i, o, pp);
}

export function create<P extends Properties>(p: P, o: OptionalObject<P>): O<P> {
    let r: O<P> = {} as O<P>;
    Object.keys(p).forEach(k => {
        createProperty(k, r, p[k], o);
    });
    return r;

    function createProperty<PP extends Properties>(k: keyof PP, r: O<PP>, pd: PropertyDescriptor, o: OptionalObject<PP>) {
        const v = o[k];
        if (v !== undefined) {
            if (pd.t === 'optional') {
                createProperty(k, r, pd.d, o);
            } else if (pd.t === 'array') {
                //const a = av.map(;

            } else if (pd.t === 'object') {
            } else {
                r[k] = v;
            }
        } else if (pd.t !== 'optional') {
        }

    }
}

