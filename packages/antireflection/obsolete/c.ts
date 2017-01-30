// name is antireflection
// usage is import * as ar from 'antireflection'
// descriptor names are ar.string, ...
// type constructor names are ar.interfaceType and ar.classType
// functor names are ar.consume, ar.produce, ar.pipe ??
// OR ar.create, ar.use and ar.pipe ?
// name for user-provided class from which descriptors are extended is Extra ??
// with Opt argument, names are interfaceTypeExtra ... ???

type TypeSelector<PN extends string, PT extends Properties<PN>> = {
    number: {type: number};
    string: {type: string};
    object: {type: ObjectType<PN, PT>};
    array:  {type: ObjectType<PN, PT>[]};
}

type PropertyTypeKind = 'number' | 'string' | 'object' | 'array';



type NumberPropertyType = {kind: 'number'; defaultValue?: number};
type StringPropertyType = {kind: 'string'; };
type ObjectPropertyType<PN extends string, PT extends Properties<PN>> = {kind: 'object'; objectType: () => PT; pn: PN; pt: PT};
type ArrayPropertyType<PN extends string, PT extends Properties<PN>> = {kind: 'array'; objectType: () => PT; pn: PN; pt: PT};


type Properties<PN extends string> = {[N in PN]: {kind: PropertyTypeKind}};

type ObjectType<PN extends string, PT extends Properties<PN>> = {[N in keyof PT]: TypeSelector<PT[N]['pn'], PT[N]['pt']>[PT[N]['kind']]['type']};

const stringType:  StringPropertyType = {kind: 'string'};
const numberType: NumberPropertyType = {kind: 'number'};
function objectType<PN extends string, PT extends Properties<PN>>(p: () => PT): ObjectPropertyType<PN, PT> {
    return {kind: 'object', objectType: p, pn: null! as PN, pt: null! as PT};
}
function arrayType<PN extends string, PT extends Properties<PN>>(p: () => PT): ArrayPropertyType<PN, PT> {
    return {kind: 'array', objectType: p, pn: null! as PN, pt: null! as PT};
}


type Constructor<T extends object> = new() => T;


function AddProperties<PN extends string, PT extends Properties<PN>, T extends object>(p: PT, cls: Constructor<T>) {
    Object.keys(p).forEach(k => {
        Object.defineProperty(cls.prototype, k, {
            get: function(this: ObjectType<PN, PT>) { return this[k] },
            set: function(this: ObjectType<PN, PT>, v: any) { this[k] = v }
        });
    });
    return cls as Constructor<T & ObjectType<PN, PT>>;
}


