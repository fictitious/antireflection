
// possible value types
export interface TypeMap<D extends PD> {
    string: string;
    number: number;
    boolean: boolean;
    date: Date;
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
    clone?(v: Value): Value;
}

// possible types of property descriptor
export interface TypeDescriptorMap {
    string: T<'string'>;
    number: T<'number'>;
    boolean: T<'boolean'>;
    date: T<'date'>;
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
// sometimes reducer needs exact type descriptor type
export interface TypedReducerArgs<N extends keyof TypeMap<PD>, R> {v: TypeMap<PD>[N]; r: R; d: T<N>; path:  Path; reduced?: boolean}

export interface CompositeObjectDescriptor {
    check?(v: Value, path: Path): string | undefined;
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
export const string: T<'string'> = {t: 'string'};
export const number: T<'number'> = {t: 'number', check: checkNumber};
export const boolean: T<'boolean'> = {t: 'boolean'};
export const date: T<'date'> = {t: 'date', check: checkDate, clone: (v: Date) => new Date(v)};
export function object<P extends Properties>(p: P): OD<P> {
    return {t: 'object', p: () => p, _p: [], ...objectMethods}
}
export function objectF<P extends Properties>(p: () => P): OD<P> {
    return {t: 'object', p: p, _p: [], ...objectMethods}
}
export function optional<D extends TypeDescriptor>(d: D): OptD<D> {
    return {t: 'optional', d: d, ...optionalMethods}
}
export function array<D extends TypeDescriptor>(d: D): AD<D> {
    return {t: 'array', d: d, ...arrayMethods}
}

// property descriptor methods
export function mapSource<D extends TypeDescriptor>(f: SourceMapper, v: Type<D>, d: D, path: Path = []): Value {
    const s = checkDescriptorType(d, v, path);
    if (s) throw new Error(s);
    const args: SourceMapperArgs = {v: d.clone ? d.clone(v) : v, d, path};
    const mv = f(args);
    return args.mappedDescriptor && args.mappedDescriptor.mapSource ? args.mappedDescriptor.mapSource(f, mv, path)
         : d.mapSource && !args.mapped ? d.mapSource(f, mv, path)
         : mv;
}

export function mapTarget<D extends TypeDescriptor>(f: TargetMapper, v: Value, d: D, path: Path = []): Type<D> {
    const args: TargetMapperArgs = {v, d, path};
    let mv = f(args);
    const s = checkDescriptorType(d, mv, path);
    if (s) throw new Error(s);
    if (d.mapTarget) {
        if (args.mapped) {
            const s = check(d, mv, path);
            if (s.length) throw new Error(s.join('; '));
        } else {
            mv = d.mapTarget(f, mv, path);
        }
    } // else atomic
    return d.clone ? d.clone(mv) : mv;
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
export const objectMethods: CompositeObjectDescriptor = {
    check: function(v: Value, path: Path) {
        const m = typeof v !== 'object' ? typeof v :
                  v === null ? 'null' :
                  Array.isArray(v) ? 'array' :
                  undefined
        ;
        return m ? `${pathMessage(path)}expected object, got ${m}` : undefined;
    },
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

export const arrayMethods: CompositeObjectDescriptor = {
    check: function(v: Value, path: Path) {
        return Array.isArray(v) ? undefined: `${pathMessage(path)}expected array, got ${typeofName(v)}`
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

export const optionalMethods: CompositeObjectDescriptor = {
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

export function typeofName(v: Value): string {
    return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
}

export function checkDate(v: Value, path: Path) {
    return ! (v instanceof Date) ? `${pathMessage(path)}expected date, got ${typeofName(v)}`
        : isNaN(v.getTime()) ? `${pathMessage(path)}invalid date`
        : undefined
    ;
}

export function checkNumber(v: Value, path: Path) {
    return typeof v !== 'number' ? `${pathMessage(path)}expected number, got ${typeofName(v)}`
        : isNaN(v) ? `${pathMessage(path)}expected number, got NaN`
        : undefined
    ;
}

export function checkDescriptorType(d: TypeDescriptor, v: Value, path: Path): string | undefined {
    return d.check ? d.check(v, path) : (typeof v !== d.t) ? `${pathMessage(path)}expected ${d.t}, got ${typeofName(v)}` : undefined;
}

export function pathMessage(path: Path): string {
    const m = path.map(e => e.text).join('');
    return m ? `${m}: ` : '';
}

export function check(d: TypeDescriptor, v: Value, path: Path = []): string[] {
    return reduce<string[]>(f, v, [], d, path);

    function f(args: ReducerArgs<string[]>): string[] {
        let {v, r, d, path} = args;
        const s = checkDescriptorType(d, v, path);
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

export type PartialObject<P extends Properties> = {[N in keyof P]?: Type<P[N]>};

// NOTE: throws if anything non-optional in P is absent in o
export function create<P extends Properties>(d: OD<P>, o: PartialObject<P>): O<P> {
    return mapTarget(({v}) => v, o, d);
}
