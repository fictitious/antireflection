
## Antireflection for TypeScript: create your types from your metadata

**TypeScript version 2.2.1 or later is required**

```sh
npm install antireflection
```

Antireflection allows you to have single source of definition for your application types,
and use it for both compile-time and run-time type checking. TypeScript does not provide
any support for accessing types at run-time, so you have to provide the data for describing
types at run time, and rely on the ability of TypeScript compiler to infer types at compile time:

```typescript
import * as ar from 'antireflection';

const pointType = ar.object({ // this is ordinary object initializer
    x: ar.number,  // ar.number (and ar.string) are just objects defined in antireflection.ts
    y: ar.number
});

type Point = ar.Type<typeof pointType>;

// it's the same as type Point = {x: number, y: number};
// but now you have its description at runtime:
// pointType.p() returns an object with Point type properties

// so, for example, you can check the type at run time:

const errors = ar.check(pointType, {x: 'a'});
console.dir(errors);
// x: expected number, got string
// y: expected number, got undefined
```
These primitive value types are supported:
- `ar.string`
- `ar.number`
- `ar.boolean`
- `ar.date`

### nested objects are supported

```typescript
const circleType = ar.object({
    center: pointType,
    radius: ar.number
});

type Circle = ar.Type<typeof circleType>;
// same as type Circle = {center: Point, radius: number};
```

Circular structures are **not** supported - TypeScript infers `any` type for an object that is
"referenced directly or indirectly in its own initializer", which does not allow to derive a type from its value.

### arrays are supported

```typescript
const polygonType = ar.object({
    points: ar.array(pointType)
});

type Polygon = ar.Type<typeof polygonType>;
// the same as type Polygon = {points: Point[]};
```

### optional properties are supported, sort of

```typescript
const labeledPointType = ar.object({
   ...pointType.p(), // use object spread to reuse properties defined for other types
   label: ar.optional(ar.string)
});

type LabeledPoint = ar.Type<typeof labeledPointType>;
// same as type LabeledPoint = Point & {label: string | undefined};
```

However, optional properties **must be present** in direct object initialization,
all you can do is to assign `undefined` to them. The workaround is to use
`ar.create()` function which accepts two arguments: type descriptor and initial value,
which can have optional properties omitted:

```typescript
const p = ar.create(labeledPointType, {x: 0, y: 0}); // ok
// const p1: LabeledPoint = {x: 0, y: 0}; // does not compile: Property 'label' is missing
const p2: LabeledPoint = {x: 0, y: 0, label: undefined}; // also ok
```

### data validation

[antireflection-validate](https://github.com/fictitious/antireflection/tree/master/packages/antireflection-validate/README.md)
adds two optional properties to type descriptors: `validate` and `constraint`.

- `validate` is a function that takes a value and returns an array of error messages, or empty array if the value is valid.
- `constraint` is [validate.js](http://validatejs.org) constraint, the value is validated by calling [validate.single()](http://validatejs.org/#validate-single).

It can be used like this:
```typescript
import * as ar from 'antireflection';
import * as arv from 'antireflection-validate';

const pointType = ar.object({x: ar.number, y: ar.number});
const circleType = ar.object({
    center: pointType,
    radius: {...ar.number, validate: (v: number) =>
        v < 0 ? [`invalid value: ${v}. must be non-negative`] : []
    }
});

console.dir(arv.validate(circleType, {center: {x: 0, y: 0}, radius: -1}));
// ['radius: invalid value: -1. must be non-negative']

const messageType = ar.object({
    text: {...ar.string, constraint: {presence: true}},
    to: {...ar.string, constraint: {email: true}}
});

type Message = ar.Type<typeof messageType>;

const m: Message = {text: '', to: 'someone'};

console.dir(arv.validate(messageType, m));
 // ['text: can\'t be blank', 'to: is not a valid email']);

```



### antireflection internals: types for properties and type descriptors

In `antireflection.ts`, `ar.object` is defined as generic function

```typescript
 export function object<P extends Properties>(p: P)
```
The type of its parameter is defined as mapped type that has specific object properties mapped to their type descriptors.

It extends `Properties` type

```typescript
export type Properties = {
    [N in string]: TypeDescriptor;
};
```
where TypeDescriptor is the supertype for all representable types.

`ar.number`, `ar.string`, `ar.boolean`, `ar.date`, `ar.array`, `ar.object` and `ar.optional` all return values typed as appropriate instances of some type that extends `TypeDescriptor`.
The return type for `ar.object` is generic interface named `OD`, short for 'object descriptor': `interface OD<P extends Properties>`.

When you define object type
```typescript
const pointType = ar.object({x: ar.number, y: ar.string});
```
its type descriptor, `pointType`, has a method named `p()` (short for properties) that returns appropriate instance of `Properties` type describing properties of that object.

### extensions: adding your own value types

To add your own value type and make it available for declaring object properties, you have to do 3 things:

- extend `TypeMap` interface which is used to declare types for properties when you use `Type<>`
- extend `TypeDescriptorMap` interface which is used to list all possible `TypeDescriptor` types
- define constant `TypeDescriptor` value with `check` and `clone` method implementations for your type

Interfaces are extended using [declaration merge](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) feature of TypeScript.
You have to add ambient declaration for `antireflection` module in order to extend it. For example, here is a module that adds [moment](http://momentjs.com/) value type

file **antireflection-moment.ts**:
```typescript
import * as ar from 'antireflection';
import * as mm from 'moment';

declare module 'antireflection' {
    export interface TypeMap<D extends PD> {
        moment: mm.Moment;
    }
    export interface TypeDescriptorMap {
        moment: T<'moment'>;
    }
}

export const moment: ar.T<'moment'> = {
    t: 'moment', // must be the same as key that you add to TypeMap and TypeDescriptorMap
    check: (v: ar.Value, path: ar.Path) =>
         mm.isMoment(v) ? undefined
       : `${ar.pathMessage(path)}expected moment, got ${ar.typeofName(v)}`
    ,
    clone: (v: mm.Moment) => mm(v)
};
```

It can be used like this:
```typescript
import * as ar from 'antireflection';
import * as arm from './antireflection-moment';
import * as moment from 'moment';

const messageType = ar.object({
    text: ar.string,
    createdTime: arm.moment
});

type MessageType = ar.Type<typeof messageType>;

const m = ar.create(messageType, {text: 't', createdTime: moment(new Date)});
console.log(moment.isMoment(m.createdTime)); // true

//const m2: MessageType = {text: 't', createdTime: new Date()};
// Type '{ text: string; createdTime: Date; }' is not assignable
// to type 'O<{ text: T<"string">; createdTime: T<"moment">; }>'.
//  Types of property 'createdTime' are incompatible.
//    Type 'Date' is not assignable to type 'Moment'.
//      Property 'format' is missing in type 'Date'.

const errors = ar.check(messageType, {text: 't', createdTime: new Date()});
console.dir(errors); // [ 'createdTime: expected moment, got object' ]

```


### antireflection internals: structural recursion

There are three functions exported: `ar.mapSource`, `ar.mapTarget` and `ar.Reduce` that take a function, a type descriptor and a value;
and apply the function to all properties, sub-properties and sub-elements of a value as described by type descriptor.

```typescript
function mapSource<D extends TypeDescriptor>(f: SourceMapper, v: Type<D>, d: D, path: Path = []): Value {
```

`mapSource` throws if value `v` does not conform to type descriptor `d`, and returns resulting value as generated by mapping function `f`.


```typescript
function mapTarget<D extends TypeDescriptor>(f: TargetMapper, v: Value, d: D, path: Path = []): Type<D> {
```

`mapTarget` takes any value v, applies mapping function `f` to it and throws if resulting value does not conform to type descriptor `d`.

```typescript
function reduce<R>(f: Reducer<R>, v: Value, r: R, d: TypeDescriptor, path: Path = []): R {
```

`reduce` throws if value `v` does not conform to type descriptor `d`, and applies reducing function `f` according to the structure described by `d`.


As an example, here is implementation of `ar.typedClone` and `ar.create`:

```typescript
export function typedClone<D extends TypeDescriptor>(d: D, v: Type<D>): Type<D> {
    return mapSource(({v}) => v, v, d);
}

export type PartialObject<P extends Properties> = {[N in keyof P]?: Type<P[N]>};

// NOTE: throws if anything non-optional in P is absent in o
export function create<P extends Properties>(d: OD<P>, o: PartialObject<P>): O<P> {
    return mapTarget(({v}) => v, o, d);
}
```

### extending type descriptors

All type descriptors inherit from generic interface which is named `T`. You can declare additional properties
for type descriptors and have them type-checked by adding ambient declaration for `antireflection` module
and using declaration merging for `T` interface.

#### antireflection-default

For example, [antireflection-default](https://github.com/fictitious/antireflection/tree/master/packages/antireflection-default/README.md)
 adds type-checked optional default value to object properties, defined like this:

```typescript
import * as ar from 'antireflection';
declare module 'antireflection' {

    export interface T<N extends keyof TypeMap<PD>> extends Partial<CompositeObjectDescriptor> {
        defaultValue?: (TypeMap<TypeDescriptor>[N]) | (() => TypeMap<TypeDescriptor>[N]);
    }
    // defaultValue can be either a value or a function that provides the value.
}
```

It also defines its own version of `create()` that takes into account default values:
```typescript
export function create<P extends ar.Properties>(d: ar.OD<P>, o: ar.PartialObject<P>) {
    return ar.mapTarget(f, o, d);

    function f(args: ar.TargetMapperArgs): ar.Value {
        return args.v !== undefined ? args.v
            : typeof args.d.defaultValue === 'function' ? args.d.defaultValue()
            : args.d.defaultValue
        ;
    }
}
```

It can be used like this:

```typescript
import * as ar from 'antireflection';
import * as ard from 'antireflection-default';

const messageType = ar.object({
    text: {...ar.string, defaultValue: ''},
    createdTime: {...ar.date, defaultValue: () => new Date()}
});

type Message = ar.Type<typeof messageType>;

const m = ard.create(messageType, {});
// will throw at runtime for non-optional properties with no value and no default

console.dir(m);
// { text: '', createdTime: 2017-02-27T17:21:04.521Z }

```

Another example for adding custom type descriptor properties is
[antireflection-validate](https://github.com/fictitious/antireflection/tree/master/packages/antireflection-validate/README.md) extension.

