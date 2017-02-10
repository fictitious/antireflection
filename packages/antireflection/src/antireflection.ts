
// possible value types
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

// type of the property value described by D
export type PT<D extends PropertyDescriptor> = TypeMap<D>[D['t']];


// base type for property descriptor, with method declarations
export type SourceMapperResult = {v: PT<PropertyDescriptor>, d?: PropertyDescriptor}; // d.mapSource, if present, is used to recurse further into v;
export type SourceMapper = (v: PT<PropertyDescriptor>, d: PropertyDescriptor) => SourceMapperResult;

export type TargetMapperResult = {v: PT<PropertyDescriptor>, mapped?: boolean}; // mapped, when true, prevents recursing into v with rd.mapTarget
export type TargetMapper = (v: PT<PropertyDescriptor>, d: PropertyDescriptor) => TargetMapperResult;

export type Reducer<R> = (v: PT<PropertyDescriptor>, r: R, d: PropertyDescriptor) => R;

export interface T<N extends keyof TypeMap<PD>> {
    t: N;
    map<D extends PropertyDescriptor, RD extends PropertyDescriptor>(this: D, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D>, rd?: RD): PT<RD>;
    // absence of check implies checking that typeof v === t
    check?(v: PT<PropertyDescriptor>): string | undefined;
    // absence of mapSource, mapTarget and reduce means that the value is elementary
    // mapSource throws if source, as consumed by f, does not conform to D. Result can be arbitrary
    mapSource?(f: SourceMapper, v: PT<PropertyDescriptor>): PT<PropertyDescriptor>;
    // mapTarget throws if result, as produced by f, does not conform to D. Source can be arbitrary
    mapTarget?<D extends PropertyDescriptor, RD extends PropertyDescriptor>(this: D, f: TargetMapper, v: PT<D>): PT<RD>;
    reduce?<R>(f: Reducer<R>, v: PT<PropertyDescriptor>, r: R): R;
}

// possible types of property descriptor
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

// helpers to shorten property descriptor definitions
export interface PArr<D extends PropertyDescriptor> extends T<'array'> {
    d: D;
}
export interface PObj<P extends Properties> extends T<'object'> {
    p: () => P;
    _p: P[];
    // assure that objects are composite (and also make pp.mapSource easily callable in typedClone below)
    mapSource(f: SourceMapper, v: PT<PropertyDescriptor>): PT<PropertyDescriptor>;
}
export interface POpt<D extends  PropertyDescriptor> extends T<'optional'> {
    d: D;
}

// property descriptor definitions for types in keyof TypeMap
export const string: T<'string'> = {t:'string', map: mapElement};
export const number: T<'number'> = {t:'number', map: mapElement};
export function object<P extends Properties>(p: () => P): PObj<P> {
    return {t:'object', p: p, _p: [], map: mapObject, mapSource: mapSourceObject, mapTarget: mapTargetObject, reduce: reduceObject}
}
export function optional<D extends PropertyDescriptor>(d: D): POpt<D> {
    return {t:'optional', d: d, map: mapOptional, check: () => undefined}
}
export function array<D extends PropertyDescriptor>(d: D): PArr<D> {
    return {t: 'array', d: d, map: mapArray, check: (v: PT<D>[]) => Array.isArray(v) ? undefined: `expected array, got ${typeof v}`}
}

// property descriptor methods
function mapSourceObject<P extends Properties, RP extends Properties>
  (this: PObj<P>, f: SourceMapper, v: O<P>): O<RP> {
    const props = this.p();
    const r: O<RP> = {} as O<RP>;
    const keys = Object.keys(props);
    keys.forEach(k => {
        const sd = props[k];
        const s = checkProperty(v[k], sd);
        if (s) throw new Error(s);
        const mr = f(v[k], sd);
        r[k] = mr.d && mr.d.mapSource ? mr.d.mapSource(f, mr.v) : mr.v;
    });
    return r;
}
function mapTargetObject<P extends Properties, RP extends Properties>
  (this: PObj<RP>, f: TargetMapper, v: O<P>): O<RP> {
    const props = this.p();
    const r: O<RP> = {} as O<RP>;
    const keys = Object.keys(props);
    keys.forEach(k => {
        const rd = props[k];
        const mr = f(v[k], rd);
        let mv = mr.v;
        const s = checkProperty(mv, rd);
        if (s) throw new Error(s);
        if (rd.mapTarget) {
            if (mr.mapped) {
                const s = checkDeep(mv, rd);
                if (s.length) throw new Error(s.join('; '));
            } else {
                mv = rd.mapTarget(f, mv);
            }
        }
        r[k] = mv;
    });
    return r;
}
function reduceObject<P extends Properties, R>
  (this: PObj<P>, f: Reducer<R>, v: O<P>, r: R): R {
    const props = this.p();
    const keys = Object.keys(props);
    let rv = r;
    keys.forEach(k => {
        const sd = props[k];
        rv = sd.reduce ? sd.reduce(f, v[k], r) : f(v[k], r, sd);
    });
    return rv;
}


// TODO: add mapSource, mapTarget like reduce,  use mapSource in typedClone
//export function mapSource<>

// TODO #2: ?? rename PropertyDescriptor -> TypeDescriptor
// TODO #3: rename PT -> Type
// TODO #4: ? introduce ValueType shorthand for Type<PropertyDescriptor>
// TODO #5: rename PArr, PObj, POpt -> ArrayDescriptor, ObjectDescriptor, OptionalDescriptor


export function reduce<R>(f: Reducer<R>, v: PT<PropertyDescriptor>, r: R, d: PropertyDescriptor): R {
    let rr: R = f(v, r, d);
    if (d.reduce) {
        rr = d.reduce(f, v, rr);
    }
    return rr;
}


export function checkProperty<D extends PropertyDescriptor>(v: PT<D>, d: D): string | undefined {
    return d.check ? d.check(v) : (typeof v !== d.t) ? `expected ${d.t}, got ${typeof v}` : undefined;
}

export function checkDeep(v: PT<PropertyDescriptor>, d: PropertyDescriptor): string[] {
    return reduce<string[]>(f, v, [], d);

    function f(v: PT<PropertyDescriptor>, r: string[], d: PropertyDescriptor): string[] {
        const s = checkProperty(v, d);
        if (s) r.push(s);
        return r;
    }
}


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

// TODO ??? make SourceMapper, TargetMapper accept object (deconstructed???) so that id could be easily written as <T>(t: T) => T
export function idSource(v: PT<PropertyDescriptor>, d: PropertyDescriptor) { return {v: v, d: d} }

// NOTE: everything in o not described in p will be trimmed out
export function typedClone<P extends Properties>(p: P, o: O<P>): O<P> {
    const pp: PObj<P> = {t: 'object', p: () => p, _p:[], map: mapObject, mapSource: mapSourceObject};
//    return pp.map(<T>(i: T) => i, o, pp);
    return pp.mapSource(idSource, o);
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

