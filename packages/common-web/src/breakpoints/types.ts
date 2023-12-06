import { IEvent } from '@zajno/common/observing/event';

export type BreakpointAnimations = {
    disableInview?: boolean,
    disableVideo?: boolean,
};

export type BreakpointData<TType extends string = string, TMeta = BreakpointAnimations> = {
    id: number;
    name: TType,
    mediaQuery: string;
    width: number;
    height: number;
    meta?: TMeta;
};

export interface ICurrentBreakpointInfo<TType extends string = string, TMeta = any> {
    readonly breakpoint: BreakpointData<TType, TMeta>;
    readonly rem: number;

    readonly width: number;
    readonly height: number;

    readonly breakpointChanged: IEvent<BreakpointData<TType, TMeta>>;
    readonly remChanged: IEvent<number>;
}
