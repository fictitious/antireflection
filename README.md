## Monorepo for antireflection packages

(packages)[https://github.com/fictitious/antireflection/tree/master/packages] contains a number of
(antireflection)[https://github.com/fictitious/antireflection/blob/master/packages/antireflection/README.md] packages that are being developed together.

### Antireflection: define your TypeScript types from your metadata

*** TypeScript version 2.2 or later is required ***

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

