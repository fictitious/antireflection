

let p0 = {
    a: {...numberType, defaultValue: 1},
    b: stringType,
    f: stringType,
    o: objectType(() => q),
    qq: arrayType(() => q)
};



let q = {
    s: stringType,
};

let p = { ... p0,
    e: stringType
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