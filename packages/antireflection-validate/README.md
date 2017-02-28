## Validation extension for [antireflection](https://github.com/fictitious/antireflection/blob/master/packages/antireflection/README.md)

```sh
npm install antireflection-validate
```

**TypeScript version 2.2.1 or later is required**

`antireflection-validate` defines two additional properties for type descriptors: `validate` and `constraint`.

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

const m: Message[] = [
    {text: 'Hi!', to: 'foo@bar.com'},
    {text: '', to: 'admin@example.com'},
    {text: 'letter', to: 'someone@special'}
];

console.dir(arv.validate(ar.array(messageType), m));
// [
//   '[1].text: can\'t be blank',
//   '[2].to: is not a valid email'
// ]


```

