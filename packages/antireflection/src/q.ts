


import * as ar from './antireflection';

const v: ar.Type<ar.TypeDescriptor> = {p: true};
const d: void = v;

export const vType = ar.object({v: ar.number});
export type V = ar.Type<typeof vType>;

export const zType = {z: ar.string};

//const zD: ar.TypeDescriptor = zType;

export type Z = ar.Type<string>;
