## Default values extension for [antireflection](https://github.com/fictitious/antireflection/blob/master/packages/antireflection/README.md)

**TypeScript version 2.2 or later is required**

```typescript
import * as ar from 'antireflection';
import * as ard from 'antireflection-default';

const pointType = ard.object({
    x: {...ar.number, defaultValue: 0},
    y: {...ar.number, defaultValue: 0}
});

type Point = ar.Type<typeof pointType>;

const p = ard.create(pointType, {x: 2});
console.dir(p);
// {x: 2, y: 0}
```
