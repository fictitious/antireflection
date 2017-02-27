## Default values extension for [antireflection](https://github.com/fictitious/antireflection/blob/master/packages/antireflection/README.md)

```sh
npm install antireflection-default
```

**TypeScript version 2.2.1 or later is required**

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

`defaultValue` can be either a value or a function without any arguments that returns a value:

```typescript
const messageType = ard.object({
    text: ar.string,
    createdTime: {...ar.date, defaultValue: () => new Date()}
});

const m = ard.create(messageType, {text:   't'});
console.log(m.createdTime);  // 2017-02-23T07:38:09.989Z
```