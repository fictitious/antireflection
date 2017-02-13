
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
export interface T<N extends keyof TypeMap<PD>> extends Partial<CompositeObjectDescriptor> { // absence of CompositeObjectDescriptor methods means that the value is atomic
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
export interface SourceMapperArgs {v: Value, d: TypeDescriptor}
export type SourceMapper = (args: SourceMapperArgs) => {v: Value, d?: TypeDescriptor}; // d.mapSource, if present, is used to recurse further into v;

export interface TargetMapperArgs {v: Value, d: TypeDescriptor}
export type TargetMapper = (args: TargetMapperArgs) => {v: Value, mapped?: boolean}; // mapped, when true, prevents recursing into v with rd.mapTarget

export interface ReducerArgs<R> {v: Value, r: R, d: TypeDescriptor}
export type Reducer<R> = (args: ReducerArgs<R>) => R;

export interface CompositeObjectDescriptor {
    // mapSource throws if source, as consumed by f, does not conform to this. Result can be arbitrary.
    mapSource(f: SourceMapper, v: Value): Value;
    // mapTarget throws if result, as produced by f, does not conform to this. Source can be arbitrary.
    mapTarget(f: SourceMapper, v: Value): Value;
    reduce<R>(f: Reducer<R>, v: Value, r: R): R;
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


// property descriptor methods
export function mapSource<D extends TypeDescriptor>(f: SourceMapper, v: Type<D>, d: D): Value {
    const s = checkT(d, v);
    if (s) throw new Error(s);
    const mr = f({v, d});
    return mr.d && mr.d.mapSource ? mr.d.mapSource(f, mr.v) : mr.v;
}

export function mapTarget<D extends TypeDescriptor>(f: TargetMapper, v: Value, d: D): Type<D> {
    const mr = f({v, d});
    let mv = mr.v;
    const s = checkT(d, mv);
    if (s) throw new Error(s);
    if (d.mapTarget) {
        if (mr.mapped) {
            const s = check(d,  mv);
            if (s.length) throw new Error(s.join('; '));
        } else {
            mv = d.mapTarget(f, mv);
        }
    } // else atomic
    return mv;
}

export function reduce<R>(f: Reducer<R>, v: Value, r: R, d: TypeDescriptor): R {
    let rv: R = f({v, r, d});
    if (d.reduce) {
        rv = d.reduce(f, v, rv);
    }
    return rv;
}

// composite property descriptor methods
const objectMethods = {
    mapSource: function<P extends Properties>(this: OD<P>, f: SourceMapper, v: O<P>): O<Properties> {
        const props = this.p();
        const r: O<Properties> = {};
        const keys = Object.keys(props);
        keys.forEach(k => {
            r[k] = mapSource(f, v[k], props[k]);
        });
        return r;
    },
    mapTarget: function <P extends Properties>(this: OD<P>, f: TargetMapper, v: O<Properties>): O<P> {
        const props = this.p();
        const r: O<P> = {} as O<P>;
        const keys = Object.keys(props);
        keys.forEach(k => {
            r[k] = mapTarget(f, v[k], props[k]);
        });
        return r;
    },
    reduce: function <P extends Properties, R>(this: OD<P>, f: Reducer<R>, v: O<P>, r: R): R {
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
    mapSource: function<D extends TypeDescriptor>(this: AD<D>, f: SourceMapper, v: Type<AD<D>>): Value[] {
        return v.map(e => mapSource(f, e, this.d));
    },
    mapTarget: function<D extends TypeDescriptor>(this: AD<D>, f: TargetMapper, v: Value[]): Type<AD<D>> {
        return v.map(e => mapTarget(f, e, this.d));
    },
    reduce: function<D extends TypeDescriptor, R>(this: AD<D>, f: Reducer<R>, v: Type<AD<D>>, r: R): R {
        return v.reduce((er, e) => reduce(f, e, er, this.d), r);
    }
};

const optionalMethods = {
    check: () => undefined,
    mapSource: function<D extends TypeDescriptor>(this: OptD<D>, f: SourceMapper, v: Type<OptD<D>>): Value | undefined {
        return v === undefined ? v : mapSource(f, v, this.d);
    },
    mapTarget: function<D extends TypeDescriptor>(this: OptD<D>, f: TargetMapper, v: Value | undefined): Type<OptD<D>> {
        return v === undefined ? v : mapTarget(f, v, this.d);
    },
    reduce: function<D extends TypeDescriptor, R>(this: OptD<D>, f: Reducer<R>, v: Type<AD<D>>, r: R): R {
        return v === undefined ? r : reduce(f, v, r, this.d);
    }
};



export function checkT(d: TypeDescriptor, v: Value): string | undefined {
    return d.check ? d.check(v) : (typeof v !== d.t) ? `expected ${d.t}, got ${typeof v}` : undefined;
}

export function check(d: TypeDescriptor, v: Value): string[] {
    return reduce<string[]>(f, v, [], d);

    function f({v, r, d}: ReducerArgs<string[]>): string[] {
        const s = checkT(d, v);
        if (s) r.push(s);
        return r;
    }
}

// TODO add path for check messages


// NOTE: everything in o not described in p will be trimmed out
export function typedClone<D extends TypeDescriptor>(d: D, v: Type<D>): Type<D> {
    return mapSource(<T>(t: T) => t, v, d);
}

/*
export type OptionalObject<P extends Properties> = {[N in keyof P]?: Type<P[N]>};

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
*/

