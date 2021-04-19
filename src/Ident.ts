type Ident<T> = T & {
    id: string;
};

export default Ident;

export type IdentAny = Ident<{}>;
