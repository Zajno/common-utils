

export type Distribution<T extends keyof any> = {
    total: number,
    byType: Partial<Record<T, number>> | null,
};

export function extendDistribution<T extends keyof any>(count: number, type: T, current?: Distribution<T>): Distribution<T> {
    const res: Distribution<T> = current ?? { total: 0, byType: { } };
    if (!res.byType) {
        res.byType = { };
    }

    if (count > 0) {
        res.byType[type] = (res.byType[type] || 0) + count;
        res.total += count;
    }

    return res;
}
