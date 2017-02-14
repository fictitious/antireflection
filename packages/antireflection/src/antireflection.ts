
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
    check?(v: Value, path: Path): string | undefined;
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
export type Path = {name: string; text: string; d: TypeDescriptor}[];

// mappedDescriptor, when present, is used instead of d to recurse into value returned by mapper.
// otherwise, if mapped is not true and d.mapSource exists, it's used to recurse into value returned by mapper.
export interface SourceMapperArgs {v: Value; d: TypeDescriptor; path: Path, mapped?: boolean; mappedDescriptor?: TypeDescriptor}
export type SourceMapper = (args: SourceMapperArgs) => Value;
// mapped, when true, prevents recursing into value returned by mapper.
export interface TargetMapperArgs {v: Value; d: TypeDescriptor; path: Path; mapped?: boolean}
export type TargetMapper = (args: TargetMapperArgs) => Value;
// reduced, when true, prevents recursing into composite values with d.reduce
export interface ReducerArgs<R> {v: Value; r: R; d: TypeDescriptor; path: Path; reduced?: boolean}
export type Reducer<R> = (args: ReducerArgs<R>) => R;

export interface CompositeObjectDescriptor {
    // mapSource throws if source, as consumed by f, does not conform to this. Result can be arbitrary.
    mapSource(f: SourceMapper, v: Value, path: Path): Value;
    // mapTarget throws if result, as produced by f, does not conform to this. Source can be arbitrary.
    mapTarget(f: SourceMapper, v: Value, path: Path): Value;
    reduce<R>(f: Reducer<R>, v: Value, r: R, path: Path): R;
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
export function mapSource<D extends TypeDescriptor>(f: SourceMapper, v: Type<D>, d: D, path: Path = []): Value {
    const s = checkT(d, v, path);
    if (s) throw new Error(s);
    const args: SourceMapperArgs = {v, d, path};
    const mv = f(args);
    return args.mappedDescriptor && args.mappedDescriptor.mapSource ? args.mappedDescriptor.mapSource(f, mv, path)
         : d.mapSource && !args.mapped ? d.mapSource(f, mv, path)
         : mv;
}

export function mapTarget<D extends TypeDescriptor>(f: TargetMapper, v: Value, d: D, path: Path = []): Type<D> {
    const args: TargetMapperArgs = {v, d, path};
    let mv = f(args);
    const s = checkT(d, mv, path);
    if (s) throw new Error(s);
    if (d.mapTarget) {
        if (args.mapped) {
            const s = check(d,  mv, path);
            if (s.length) throw new Error(s.join('; '));
        } else {
            mv = d.mapTarget(f, mv, path);
        }
    } // else atomic
    return mv;
}

export function reduce<R>(f: Reducer<R>, v: Value, r: R, d: TypeDescriptor, path: Path = []): R {
    const args: ReducerArgs<R> = {v, r, d, path};
    let rv: R = f(args);
    if (!args.reduced && d.reduce) {
        rv = d.reduce(f, v, rv, path);
    }
    return rv;
}

// composite property descriptor methods
const objectMethods = {
    mapSource: function<P extends Properties>(this: OD<P>, f: SourceMapper, v: O<P>, path: Path): O<Properties> {
        const props = this.p();
        const r: O<Properties> = {};
        const keys = Object.keys(props);
        keys.forEach(k => {
            r[k] = objectNext(path, k, props[k], () => mapSource(f, v[k], props[k], path));
        });
        return r;
    },
    mapTarget: function <P extends Properties>(this: OD<P>, f: TargetMapper, v: O<Properties>, path: Path): O<P> {
        const props = this.p();
        const r: O<P> = {} as O<P>;
        const keys = Object.keys(props);
        keys.forEach(k => {
            r[k] = objectNext(path, k, props[k], () => mapTarget(f, v[k], props[k], path));
        });
        return r;
    },
    reduce: function <P extends Properties, R>(this: OD<P>, f: Reducer<R>, v: O<P>, r: R, path: Path): R {
        const props = this.p();
        const keys = Object.keys(props);
        let rv = r;
        keys.forEach(k => {
            rv = objectNext(path, k, props[k], () => reduce(f, v[k], rv, props[k], path));
        });
        return rv;
    }
};
function objectNext<R>(path: Path, name: string, d: TypeDescriptor, f: () => R): R {
    path.push({name, text: path.length ? `.${name}` : name, d});
    const r = f();
    path.pop();
    return r;
}

const arrayMethods = {
    check: function(v: Value, path: Path) {
        return Array.isArray(v) ? undefined: `${pathMessage(path)}expected array, got ${typeof v}`
    },
    mapSource: function<D extends TypeDescriptor>(this: AD<D>, f: SourceMapper, v: Type<AD<D>>, path: Path): Value[] {
        return v.map((e, index) => arrayNext(path, index, this.d, () => mapSource(f, e, this.d, path)));
    },
    mapTarget: function<D extends TypeDescriptor>(this: AD<D>, f: TargetMapper, v: Value[], path: Path): Type<AD<D>> {
        return v.map((e, index) => arrayNext(path, index, this.d, () => mapTarget(f, e, this.d, path)));
    },
    reduce: function<D extends TypeDescriptor, R>(this: AD<D>, f: Reducer<R>, v: Type<AD<D>>, r: R, path: Path): R {
        return v.reduce((er, e, index) => arrayNext(path, index, this.d, () => reduce(f, e, er, this.d, path)), r);
    }
};
function arrayNext<R>(path: Path, index: number, d: TypeDescriptor, f: () => R): R {
    path.push({name: index.toString(), text: `[${index}]`, d});
    const r = f();
    path.pop();
    return r;
}

const optionalMethods = {
    check: () => undefined,
    mapSource: function<D extends TypeDescriptor>(this: OptD<D>, f: SourceMapper, v: Type<OptD<D>>, path: Path): Value | undefined {
        return v === undefined ? v : optionalNext(path, this.d, () => mapSource(f, v, this.d, path));
    },
    mapTarget: function<D extends TypeDescriptor>(this: OptD<D>, f: TargetMapper, v: Value | undefined, path: Path): Type<OptD<D>> {
        return v === undefined ? v : optionalNext(path, this.d, () => mapTarget(f, v, this.d, path));
    },
    reduce: function<D extends TypeDescriptor, R>(this: OptD<D>, f: Reducer<R>, v: Type<AD<D>>, r: R, path: Path): R {
        return v === undefined ? r : optionalNext(path, this.d, () => reduce(f, v, r, this.d, path));
    }
};
function optionalNext<R>(path: Path, d: TypeDescriptor, f: () => R): R {
    path.push({name: '', text: path.length ? '?' : '', d});
    const r = f();
    path.pop();
    return r;
}



export function checkT(d: TypeDescriptor, v: Value, path: Path): string | undefined {
    return d.check ? d.check(v, path) : (typeof v !== d.t) ? `${pathMessage(path)}expected ${d.t}, got ${typeof v}` : undefined;
}

function pathMessage(path: Path): string {
    return path.length ? `${path.map(e => e.text).join('')}: ` : '';
}


export function check(d: TypeDescriptor, v: Value, path: Path = []): string[] {
    return reduce<string[]>(f, v, [], d, path);

    function f(args: ReducerArgs<string[]>): string[] {
        let {v, r, d, path} = args;
        const s = checkT(d, v, path);
        if (s) {
            r.push(s);
            // prevent recursing into wrong value
            args.reduced = true;
        }
        return r;
    }
}


// NOTE: everything in o not described in p will be trimmed out
export function typedClone<D extends TypeDescriptor>(d: D, v: Type<D>): Type<D> {
    return mapSource(({v}) => v, v, d);
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

