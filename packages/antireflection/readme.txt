
Antireflection: make TypeScript infer the type from object literal describing the type.

You can create definition of types in a way similar to <backbone>, and have the code that uses these types type-checked by TypeScript compiler.

[aside
why one should not expect usual-style reflection appearing in TypeScript any time soon.

TypeScipt philosophy is that type-checking is nice to have, and it must be convenient.
For type checking in TypeScript, people naturally tend to depend on compiler inferring types for them.
Type inference is no simple matter, the implementation is complex and depends on a lot
of internal details in the compiler.

So, "nice to have" stance is just a very convenient way of saying that if something goes wrong
with type inference or type checking, the worst that could happen is that some errors will
not be reported for code that is not type-safe, or some false errors will be reported for correct code.

This guarantees that bugs in type checking and type inference will never break user code - the resulting
code will be generated from the source exactly as it's written.

This is the reason for "we won't do type-guided code generation" sentiment expressed in [find reference]

Because reflection essentially is generating some data structures accessible at runtime based on the
types declared or inferred for entities in user code, it's outright precluded by 'won't do type-guided code generation' sentiment.

So, how to have 'single source' of type definitions that is also accessible at runtime?
The way to go about it in the spirit of TypeScript is to explicitly provide all the data
you need to describe your types, and have typscript to infer types from it.

]