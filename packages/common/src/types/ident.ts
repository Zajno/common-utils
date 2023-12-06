
export type Ident<T, K extends keyof any = string> = T & {
    id: K;
};

export type IdentAny = Ident<object>;

export default Ident;
