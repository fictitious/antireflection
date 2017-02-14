
# Antireflection for TypeScript: create your types from your metadata

```
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

## nested objects

## arrays

## optional

## extensions

### how to add your own type for properties

### how to add extras to type descriptors