import { IdentAny } from '@zajno/common/types/ident';
import { FirestoreDataConverter, QueryDocumentSnapshot, TimestampClass } from './dbProvider';


export interface FirestoreObjectConverter<T> {
    toFirestore(model: T): T;
    fromFirestore(data: T | undefined, snapshot: QueryDocumentSnapshot, options?: any): T;
}

export namespace FirestoreObjectConverter {
    export function IdentConverter<T extends IdentAny>(): FirestoreObjectConverter<T> {
        return {
            toFirestore(m: T) {
                delete m.id;
                return m;
            },
            fromFirestore(m: T, snapshot: QueryDocumentSnapshot, options?: any) {
                const d = m ? m : snapshot.data(options) as T;
                d.id = snapshot.id;
                return d;
            },
        };
    }

    export function TimestampConverter<T>(Timestamp: TimestampClass, ...keys: (keyof T)[]): FirestoreObjectConverter<T> {
        return {
            toFirestore(m: T) {
                keys.forEach(key => {
                    const v = m[key];
                    if (typeof v === 'number') {
                        m[key] = Timestamp.fromMillis(v) as any;
                    }
                });
                return m;
            },
            fromFirestore(m: T, snapshot: QueryDocumentSnapshot, options?: any) {
                const d = m ? m : snapshot.data(options) as T;
                keys.forEach(key => {
                    const v = d[key];
                    if (v instanceof Timestamp) {
                        d[key] = v.toMillis() as any;
                    }
                });
                return d;
            },
        };
    }
}

export function objectToDataConverter<T>(converter: FirestoreObjectConverter<T>): FirestoreDataConverter<T> {
    return {
        toFirestore(model: T) { return converter.toFirestore(model); },
        fromFirestore(snapshot: QueryDocumentSnapshot, options?: any) {
            return converter.fromFirestore(undefined, snapshot, options);
        },
    };
}

export function combineConverters<T>(...converters: FirestoreObjectConverter<T>[]): FirestoreObjectConverter<T> {
    return {
        toFirestore(model: T) {
            let result = model;
            converters.forEach(c => {
                result = c.toFirestore(result);
            });
            return result;
        },
        fromFirestore(data: T, snapshot: QueryDocumentSnapshot, options?: any): T {
            let result = data;
            converters.forEach(c => {
                result = c.fromFirestore(result, snapshot, options);
            });
            return result;
        },
    };
}
