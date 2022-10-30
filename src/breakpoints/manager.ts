import { BreakpointData, ICurrentBreakpointInfo } from './types';
import { Event } from '@zajno/common/lib/observing/event';
import { createLogger } from '@zajno/common/lib/logger';
import { calcRem } from './rem';

const logger = createLogger('[Breakpoints]');

export class BreakpointsManager<TType extends string = string, TMeta = any> implements ICurrentBreakpointInfo<TType, TMeta> {

    private readonly _remChanged = new Event<number>();
    private readonly _breakpointChanged = new Event<BreakpointData<TType, TMeta>>();

    private readonly _list: BreakpointData<TType, TMeta>[] = [];

    private readonly _state = {
        width: 0,
        height: 0,
        currentBreakpoint: null as BreakpointData<TType, TMeta>,
        currentRem: 0.0,
    };

    registerBreakpoint(bp: BreakpointData<TType, TMeta>) {
        const existing = this._list.findIndex(b => b.id === bp.id);
        if (existing >= 0) {
            this._list[existing] = bp;
        } else {
            this._list.push(bp);
            this._list.sort((b1, b2) => b1.id - b2.id);
        }
    }

    get breakpoint() { return this._state.currentBreakpoint; }

    get rem() { return this._state.currentRem; }

    get width() { return this._state.width; }
    get height() { return this._state.height; }

    get breakpointChanged() { return this._breakpointChanged; }
    get remChanged() { return this._remChanged; }

    resize(width: number, height: number) {
        let bp = this._list.find(b => window.matchMedia(b.mediaQuery).matches);
        if (!bp) {
            bp = this._list[0];
        }

        this._state.width = width;
        this._state.height = height;

        const rem = calcRem(width, height, bp);

        logger.log('Current breakpoint:', `[${width}x${height}]`, bp, '; rem =', rem);

        if (!this._state.currentBreakpoint || this._state.currentBreakpoint.id !== bp.id) {
            this._state.currentBreakpoint = bp;
            this._breakpointChanged.trigger(bp);
        }

        if (this._state.currentRem !== rem) {
            this._state.currentRem = rem;
            this._remChanged.trigger(rem);
        }
    }
}
