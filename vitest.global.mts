
export const setup = () => {
    process.env.TZ = 'UTC';
    // @ts-ignore
    import.meta.env.TZ = 'UTC';
};
