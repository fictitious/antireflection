

import * as ar from './antireflection';

const personProperties = {
    firstName: ar.string,
    lastName: {...ar.optional(ar.string), defaultValue: ''},
    a: ar.optional(ar.object(() => aProperties))
};

const aProperties = {
    a: ar.string
};

function fullName(o: Person): string {
    return `${o.firstName} ${o.lastName} ${o.a.a}`
}

console.log(fullName({firstName: 'a',lastName: undefined, a: {a1: 'x'}}));

//const personType = ar.interfaceType(personProperties);
type Person = ar.O<typeof personProperties>;

let m: Person = {firstName: 'a', lastName: 'b', a: {a: 'z'}};
let z: void;
m.firstName = 'q';
m.a.a = 2;


declare module './antireflection' {
    export interface TypeMap<D extends PD> {
        boolean: boolean;
    }
}
export const boolean: {t: 'boolean'} = {t: 'boolean'};


const flaggedPersonProperties = {
    ... personProperties,
    flagged: boolean
};

function f(o: ar.O<typeof flaggedPersonProperties>, p: string): string {
    return o.flagged ? 'good' : 'bad';
}

f({firstName: 'p', lastName: 'q', a: undefined, flagged: false}, 'd');


// ====
//interface ExtraPropertyDescriptor<T> extends ar.PropertyDescriptor {
//    defaultValue: T;
//}

//type ExtraProperties<P extends ar.Properties> = {[N in keyof P]: ExtraPropertyDescriptor<ar.TypeSelector<P[N]['p']>[P[N]['optional']][P[N]['type']]>};
//type ExtraProperties<P extends ar.Properties> = {[N in keyof P]: PropertyDescriptor & {defaultValue?: ar.PT<P, N>}};

//type TypedProperties<P extends ar.Properties> = {[N in keyof P]: ar.PropertyDescriptor<ar.PT<P, N>>}

//type ObjectType<P extends ar.Properties> = {[N in keyof P]: {t: ar.PT<P, N>}};

//let a: TypedProperties<typeof personProperties>;
//a.firstName = {t: 3}

//type DProperties<P extends ar.Properties, TP extends TypedProperties<P>> = {[N in keyof TP]: TP[N] & {defaultValue?: TP[N]['t']}};
type DevaultValues<P extends ar.Properties> = P & {[N in keyof P]: PropertyDescriptor &  {defaultValue?: ar.PT<P[N]>}};

function i<P extends ar.Properties>(p: DevaultValues<P>, o: ar.O<P>) {
    Object.keys(p).forEach(n => {
        const v = p[n].defaultValue;
        if (o[n] === undefined && v !== undefined) {
            o[n] = v;
        }
    });
}

/*
function ix<P extends ar.Properties>(p: P, o: ar.ObjectType<P>) {
    i<P>(p, o)
//    Object.keys(p).forEach(n => o[n] = p[n].defaultValue);
}
function i2<P extends ar.Properties>(p: P, dp: DProperties<P>, o: ar.ObjectType<P>) {
    Object.keys(p).forEach(n => o[n] = dp[n].defaultValue);
}
*/
/*
function i<P extends ar.Properties>(p: ExtraProperties<P>, o: ar.ObjectType<P>) {
    Object.keys(p).forEach(n => o[n] = p[n].defaultValue);
}
*/

const abProperties = {
    a: {...ar.string, defaultValue: 42},
    b: ar.number
};


//let iii: DProperties<typeof abProperties> = abProperties;
//iii.a.defaultValue = 4; // ?????


let ii = i(abProperties, {/*a: '', b: 0*/}); //!! does not typecheck the {}
//let ii2 = ix(abProperties, {});  // !! does typecheck {} ?
//let ii3 = i2(abProperties, abProperties, {}); // YESSS !!!!
console.dir(ii);



/*
interface X<T> {i: T};
interface Y<T> extends X<T> { z: X<T>['i']}


*/