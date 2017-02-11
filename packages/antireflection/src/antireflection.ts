
// possible value types
export interface TypeMap<D extends PD> {
    string: string;
    number: number;
    object: O<D['_p'][0]>;
    array: Type<D['d']>[];
    optional: Type<D['d']> | undefined;
}

// implementation type.
// must have all the properties used in TypeMap to index D type,
// and must be assignable to TypeDescriptor
export interface PD  {
    t: keyof TypeMap<PD>;
    _p: Properties[];
    d: TypeDescriptor;
}

// type of the property value described by D
export type Type<D extends TypeDescriptor> = TypeMap<D>[D['t']];

// 'untyped' value type (unknown exactly at compile time)
export type Value = Type<TypeDescriptor>;

// base type for property descriptor
export interface T<N extends keyof TypeMap<PD>> extends Partial<CompositeObjectDescriptor> { // absence of CompositeObjectDescriptor methods means that the value is elementary
    t: N;
    // absence of check implies checking that typeof v === t
    check?(v: Value): string | undefined;
}

// possible types of property descriptor
export interface TypeDescriptorMap {
    string: T<'string'>;
    number: T<'number'>;
    array: T<'array'> & {d: TypeDescriptor};
    object: T<'object'> & {p: () => Properties; _p: Properties[]};
    optional: T<'optional'> & {d: TypeDescriptor};
}
export type TypeDescriptor = TypeDescriptorMap[keyof TypeDescriptorMap];

// set of properties, each with a name and property descriptor
export type Properties = {
    [N in string]: TypeDescriptor;
};

// type of the object defined by a set of properties P
export type O<P extends Properties> = {[N in keyof P]: Type<P[N]>};

// composite descriptor method declarations
export interface SourceMapper {v: Value, d: TypeDescriptor}
export type SourceMapperFunc = (args: SourceMapper) => {v: Value, d?: TypeDescriptor}; // d.mapSource, if present, is used to recurse further into v;

export interface TargetMapper {v: Value, d: TypeDescriptor}
export type TargetMapperFunc = (args: TargetMapper) => {v: Value, mapped?: boolean}; // mapped, when true, prevents recursing into v with rd.mapTarget

export interface Reducer<R> {v: Value, r: R, d: TypeDescriptor}
export type ReducerFunc<R> = (args: Reducer<R>) => R;

export interface CompositeObjectDescriptor {
    // mapSource throws if source, as consumed by f, does not conform to this. Result can be arbitrary.
    mapSource(f: SourceMapperFunc, v: Value): Value;
    // mapTarget throws if result, as produced by f, does not conform to this. Source can be arbitrary.
    mapTarget(f: SourceMapperFunc, v: Value): Value;
    reduce<R>(f: ReducerFunc<R>, v: Value, r: R): R;
}

// composite descriptor types
export type ArrayDescriptor = T<'array'> & CompositeObjectDescriptor;
export interface AD<D extends TypeDescriptor> extends ArrayDescriptor {
    d: D;
}

export type ObjectDescriptor = T<'object'> & CompositeObjectDescriptor;
export interface OD<P extends Properties> extends ObjectDescriptor {
    p: () => P;
    _p: P[];
}

export type OptionalDescriptor = T<'optional'> & CompositeObjectDescriptor;
export interface OptD<D extends  TypeDescriptor> extends OptionalDescriptor {
    d: D;
}

// property descriptor definitions for types in keyof TypeMap
export const string: T<'string'> = {t:'string'};
export const number: T<'number'> = {t:'number'};
export function object<P extends Properties>(p: P): OD<P> {
    return {t:'object', p: () => p, _p: [], ...objectMethods}
}
export function objectF<P extends Properties>(p: () => P): OD<P> {
    return {t:'object', p: p, _p: [], ...objectMethods}
}
export function optional<D extends TypeDescriptor>(d: D): OptD<D> {
    return {t:'optional', d: d, ...optionalMethods}
}
export function array<D extends TypeDescriptor>(d: D): AD<D> {
    return {t: 'array', d: d, ...arrayMethods}
}

export function reduce<R>(f: ReducerFunc<R>, v: Value, r: R, d: TypeDescriptor): R {
    let rv: R = f({v, r, d});
    if (d.reduce) {
        rv = d.reduce(f, v, rv);
    }
    return rv;
}

// TODO: add mapSource, mapTarget like reduce,  use mapSource in typedClone

// property descriptor methods
const objectMethods = {
    mapSource: function<P extends Properties, RP extends Properties>(this: OD<P>, f: SourceMapperFunc, v: Value): O<RP> {
        const props = this.p();
        const r: O<RP> = {} as O<RP>;
        const keys = Object.keys(props);
        keys.forEach(k => {
            const sd = props[k];
            const s = checkT(v[k], sd);
            if (s) throw new Error(s);
            const mr = f({v: v[k], d: sd});
            r[k] = mr.d && mr.d.mapSource ? mr.d.mapSource(f, mr.v) : mr.v;
        });
        return r;
    },
    mapTarget: function <P extends Properties, RP extends Properties>(this: OD<RP>, f: TargetMapperFunc, v: Value): O<RP> {
        const props = this.p();
        const r: O<RP> = {} as O<RP>;
        const keys = Object.keys(props);
        keys.forEach(k => {
            const rd = props[k];
            const mr = f({v: v[k], d: rd});
            let mv = mr.v;
            const s = checkT(mv, rd);
            if (s) throw new Error(s);
            if (rd.mapTarget) {
                if (mr.mapped) {
                    const s = check({v: mv, d: rd});
                    if (s.length) throw new Error(s.join('; '));
                } else {
                    mv = rd.mapTarget(f, mv);
                }
            }
            r[k] = mv;
        });
        return r;
    },
    reduce: function <P extends Properties, R>(this: OD<P>, f: ReducerFunc<R>, v: Value, r: R): R {
        const props = this.p();
        const keys = Object.keys(props);
        let rv = r;
        keys.forEach(k => {
            rv = reduce(f, v[k], rv, props[k]);
        });
        return rv;
    }
};

const arrayMethods = {
    check: function(v: Value) {
        return Array.isArray(v) ? undefined: `expected array, got ${typeof v}`
    },
    mapSource: function() {
    },
    mapTarget: function() {
    },
    reduce: function() {
    }
};

const optionalMethods = {
    check: () => undefined,
    mapSource: function() {
    },
    mapTarget: function() {
    },
    reduce: function() {
    }
};



export function checkT(v: Value, d: TypeDescriptor): string | undefined {
    return d.check ? d.check(v) : (typeof v !== d.t) ? `expected ${d.t}, got ${typeof v}` : undefined;
}

export interface Check {v: Value, d: TypeDescriptor}
export function check({v, d}: Check): string[] {
    return reduce<string[]>(f, v, [], d);

    function f({v, r, d}: Reducer<string[]>): string[] {
        const s = checkT(v, d);
        if (s) r.push(s);
        return r;
    }
}

// TODO add path for check messages

/*
function mapElement<D extends TypeDescriptor, RD extends TypeDescriptor>
  (this: D, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D>, rd?: RD): PT<RD> {
    return f(v, this, rd);
}
function mapOptional<D extends TypeDescriptor, RD extends TypeDescriptor>
  (this: POpt<D>, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D> | undefined, rd?: POpt<RD>): PT<RD> | undefined {
    return v === undefined ? undefined : this.d.map(f, v, rd && rd.d);
}
function mapObject<P extends Properties, RP extends Properties, D extends TypeDescriptor, RD extends TypeDescriptor>
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
function mapArray<D extends TypeDescriptor, RD extends TypeDescriptor>
(this: PArr<D>, f: (v: PT<D>, d: D, rd?: RD) => PT<RD>, v: PT<D>[], rd?: PArr<RD>): PT<RD>[] {
    return v.map(e => this.d.map(f, e, rd && rd.d));
}

*/

export type OptionalObject<P extends Properties> = {[N in keyof P]?: Type<P[N]>};

//export function idSource(v: Value, d: TypeDescriptor): SourceMapperResult { return {v: v, d: d} }

// NOTE: everything in o not described in p will be trimmed out
export function typedClone<D extends TypeDescriptor>(d: D, v: Type<D>): Type<D> {
//    const pp: PObj<P> = {t: 'object', p: () => p, _p:[], map: mapObject, mapSource: mapSourceObject};
//    return pp.map(<T>(i: T) => i, o, pp);
//    return pp.mapSource(idSource, o);
    return d.mapSource ? d.mapSource(<T>(t: T) => t, v) : v;
}

export function create<P extends Properties>(p: P, o: OptionalObject<P>): O<P> {
    let r: O<P> = {} as O<P>;
    Object.keys(p).forEach(k => {
        createProperty(k, r, p[k], o);
    });
    return r;

    function createProperty<PP extends Properties>(k: keyof PP, r: O<PP>, pd: TypeDescriptor, o: OptionalObject<PP>) {
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

