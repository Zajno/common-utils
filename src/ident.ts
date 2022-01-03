
export type Ident<T, K extends keyof any = string> = T & {
    id: K;
};

export type IdentAny = Ident<{}>;

export default Ident;
