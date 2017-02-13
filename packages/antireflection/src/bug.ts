export interface TypeMap {
    a: string;
    b: number;
}
export interface Indexer {
    n: keyof TypeMap;
}
export type T<I extends Indexer> = TypeMap[I['n']];

export declare let _s: {n: 'a'};
export type S = T<typeof _s>;

let s: S = 1; // this is correct and works as expected , that is S is string:
//Type '1' is not assignable to type 'string'.


// but for some reason the constraint on T generic parameter is not enforced:
export type Q = T<void>; // ok

export type TT<I extends Indexer> = TypeMap['a'];
export type QQ = TT<void>; // and it seems to be caused by particular form of alias: T = TypeMap[I['n']]
// Type 'void' does not satisfy the constraint 'Indexer'.