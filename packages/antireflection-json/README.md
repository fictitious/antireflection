## checked conversion to/from JSON using [antireflection](https://github.com/fictitious/antireflection/blob/master/packages/antireflection/README.md)

```sh
npm install antireflection-json
```

**TypeScript version 2.2.1 or later is required**

`antireflection-json` provides two functions `toJSON()` and `fromJSON()` that rely on antireflection type descriptions for doing conversion.

`toJSON()` will output only properties that exist in type descriptors:

```typescript
import * as ar from 'antireflection';
import * as arj from 'antireflection-json';

const messageType = ar.object({
    text: ar.string,
    createdTime: ar.date
});

type Message = ar.Type<typeof messageType>;

const m = {
    text: 'abc',
    createdTime: new Date(Date.UTC(2017, 1, 1, 2, 3, 4, 0)),
    extra: 'stuff'
};

const json = arj.toJSON(messageType, m);

console.dir(json);
//{ text: 'abc', createdTime: '2017-02-01T02:03:04.000Z' }
```

`fromJSON()` will throw an exception if the value does not conform to the type:

```typescript
json.createdTime = 'e';

try {
    const r = arj.fromJSON(messageType, json);
    console.dir(r);
} catch(e) {
    console.log(e.message);
    // createdTime: invalid date: e
}

```

