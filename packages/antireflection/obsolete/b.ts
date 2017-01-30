
type TypeSelector<PN extends string, PT extends Properties<PN>> = {
    number: {type: number};
    string: {type: string};
    object: {type: ObjectType<PN, PT>};
    array:  {type: ObjectType<PN, PT>[]};
}
type OptionalTypeSelector<PN extends string, PT extends Properties<PN>> = {
    number: {type: number | undefined};
    string: {type?: string | undefined};
    object: {type: ObjectType<PN, PT> | undefined};
    array:  {type: ObjectType<PN, PT>[] | undefined};
}
type ExistenceSelector<PN extends string, PT extends Properties<PN>> = {
    optional: OptionalTypeSelector<PN, PT>;
    required: TypeSelector<PN, PT>;
}


type PropertyTypeKind = 'number' | 'string' | 'object' | 'array';
type PropertyExistenceKind = 'required' | 'optional';

type PropertyType = {kind: PropertyTypeKind, existence: PropertyExistenceKind};

type NumberPropertyType = {kind: 'number'; existence: 'required', defaultValue?: number};
type OptionalNumberPropertyType = {kind: 'number'; existence: 'optional', defaultValue?: number};
type StringPropertyType = {kind: 'string'; existence: 'required'; };
type OptionalStringPropertyType = {kind: 'string'; existence: 'optional'; };
type ObjectPropertyType<PN extends string, PT extends Properties<PN>> = {kind: 'object'; existence: PropertyExistenceKind; objectType: () => PT; pn: PN; pt: PT};
type ArrayPropertyType<PN extends string, PT extends Properties<PN>> = {kind: 'array'; existence: PropertyExistenceKind; objectType: () => PT; pn: PN; pt: PT};


type Properties<PN extends string> = {[N in PN]: PropertyType};

type ObjectType<PN extends string, PT extends Properties<PN>> = {[N in keyof PT]: ExistenceSelector<PT[N]['pn'], PT[N]['pt']>[PT[N]['existence']][PT[N]['kind']]['type']};

const string:  StringPropertyType = {kind: 'string', existence: 'required'};
const optionalStringType: OptionalStringPropertyType = {kind: 'string', existence: 'optional'};
const number: NumberPropertyType = {kind: 'number', existence: 'required'};
function object<PN extends string, PT extends Properties<PN>>(p: () => PT): ObjectPropertyType<PN, PT> {
    return {kind: 'object', existence: 'required', objectType: p, pn: null! as PN, pt: null! as PT};
}
function array<PN extends string, PT extends Properties<PN>>(p: () => PT): ArrayPropertyType<PN, PT> {
    return {kind: 'array', existence: 'required', objectType: p, pn: null! as PN, pt: null! as PT};
}

// ?? waiting for spread types support
// https://github.com/Microsoft/TypeScript/issues/10727
// https://github.com/Microsoft/TypeScript/issues/12756#issuecomment-265812676
/*
function optional<P extends PropertyType>(p: P): P & {existence: 'optional'} {
    return {...p, existence: 'optional'};
}
*/
function optional(p: typeof string): OptionalStringPropertyType { return {kind: p.kind, existence: 'optional'} };

type Constructor<T> = new() => T;


function AddProperties<PN extends string, PT extends Properties<PN>, T>(p: PT, cls: Constructor<T>) {
    Object.keys(p).forEach(k => {
        Object.defineProperty(cls.prototype, k, {
            get: function() { return this[k] },
            set: function(v) { this[k] = v }
        });
    });
    return cls as Constructor<T & ObjectType<PN, PT>>;
}




let p0 = {
    a: {...number, defaultValue: 1},
    b: optionalStringType,
    f: string,
    o: object(() => q),
    qq: array(() => q)
};

function interfaceType<PN extends string, PT extends Properties<PN>>(p: PT): ObjectType<PN, PT> {
    return null! as ObjectType<PN, PT>;
}

const P0 = interfaceType(p0);
export type PT0 = typeof P0;

function ppp(d: PT0) {
    let a: number = d.a;
    let b: string = d.b;
    console.dir(d);

}

//ppp({a: 1, f: '', o:{s: 'w'}, qq:[]});
const pp00: PT0 = {a: 1, b: 'rr', f: '', o:{s1: 'w'}, qq:[]};
pp00.qq.push({s: 'ee'});

let q = {
    s: string,
};

let p = { ... p0,
    e: string
};

function fz<T> () { return null! as T }

let z1 = {
    a: 'a',
    q: fz<typeof z2>()
};
let z2 = {
    b: 'b',
    c: fz<typeof z1>()
};

//type P = keyof typeof p;

//let z: P = function() {};



//class C {}
let f = function() { return 0 };

//const zz = f() ? 'true' : 'false';

class D extends AddProperties(p, class {}) {

    constructor() {
        super();
        this.a = 1;
        this.b = 2;
        this.c = 4;
    }
}

//    AddProperty('true', 'a', {type: 0},
//    AddProperty('false', 'b', {type: ''},
//    AddProperty(zz, 'c', {type: ''},
//class C {}))/*)*/ {}


let d: D = new D();

let z: void;
d.o = z;

d.o = {s: 'q'};
d.o = {e: 'm'};
d.o.s = 'r';
d.o.s = 21;

d.qq = 1;
d.qq.push({s: 'e'});

d.a = z;

d.a = 'a';

let t1: string = d.b;
let t2: number = d.b;

type K = keyof D;

let k: K = 'p';
k = 4;

//d.b = 'c';





/*
 class StringPropertyType {
 type: string;
 }
 class NumberPropertyType {
 type: number;
 }

 let q = {
 a: StringPropertyType,
 b: NumberPropertyType
 };
 */