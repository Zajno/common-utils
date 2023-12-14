export type StatusWithDate<TStatus extends string = string> = {
    status: TStatus | null,
    date: number,
};

type HistoryItem<TStatus extends string> = {
    d: number,
    s: TStatus | null,
};

export type EntityWithStatus<TStatus extends string> = StatusWithDate<TStatus> & {
    history?: HistoryItem<TStatus>[],
};

export namespace EntityWithStatus {

    export function changeStatus<T extends EntityWithStatus<TStatus>, TStatus extends string>(entity: Partial<T>, status: TStatus, date: number | null = null, allowStatusUpdate = false) {
        if (!entity) {
            return false;
        }

        if (entity.status === status && !allowStatusUpdate) {
            return false;
        }

        if (!entity.history) {
            entity.history = [];
        }

        entity.history.push({ d: entity.date || Date.now(), s: entity.status || null });
        entity.date = date || Date.now();
        entity.status = status;
        return true;
    }

    export function getLastStatusDate<T extends EntityWithStatus<TStatus>, TStatus extends string>(entity: T, ...statuses: TStatus[]) {
        if (!entity || !statuses.length) {
            return null;
        }

        if (entity.status && statuses.includes(entity.status)) {
            return entity.date;
        }

        if (entity.history && entity.history.length) {
            const t = entity.history.find(h => h.s && statuses.includes(h.s));
            if (t) {
                return t.d;
            }
        }

        return null;
    }

    export function getFullHistory<T extends EntityWithStatus<TStatus>, TStatus extends string>(entity: T): StatusWithDate<TStatus>[] {
        const result: StatusWithDate<TStatus>[] = [];
        if (entity.history?.length) {
            result.push(...entity.history.map(h => ({ date: h.d, status: h.s })));
        }
        result.push({ date: entity.date, status: entity.status });
        return result;
    }
}
