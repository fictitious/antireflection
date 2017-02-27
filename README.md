## Monorepo for antireflection packages

This is a monorepo for the development of
[antireflection](https://github.com/fictitious/antireflection/blob/master/packages/antireflection/README.md) [packages](https://github.com/fictitious/antireflection/tree/master/packages).

Antireflection allows you to have single source of definition for your application types,
and use it for both compile-time and run-time type checking.

**TypeScript version 2.2.1 or later is required**

```sh
npm install antireflection
```

```typescript
import * as ar from 'antireflection';

const pointType = ar.object({ // this is ordinary object initializer
    x: ar.number,  // ar.number (and ar.string) are just objects
    y: ar.number   // defined in antireflection.ts
});


type Point = ar.Type<typeof pointType>;
// it's the same as type Point = {x: number, y: number};
// but now you can use pointType, for example, to check the type at run time:

const errors = ar.check(pointType, {x: 'a'});
console.dir(errors);
// x: expected number, got string
// y: expected number, got undefined

```

### development

in order to run tests, you must have
- node >= 6.0.0
- gnu make
- unix shell

```sh

git clone https://github.com/fictitious/antireflection
cd antireflection

make bootstrap

for p in $(ls packages) ; do make test-${p} ; done

```

