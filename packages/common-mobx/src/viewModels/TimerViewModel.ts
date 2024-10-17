import { Timer, TimerState } from '@zajno/common/observing/timer';
import { FlagModel } from './FlagModel.js';
import { Nullable } from '@zajno/common/types';
import { Disposable } from '@zajno/common/functions/disposer';
import { action } from 'mobx';
import { ValueModel } from './ValueModel.js';

export class TimerViewModel extends Disposable {

    private readonly _enabled = new FlagModel();
    private readonly _state = new ValueModel<Nullable<TimerState>>(null, true);

    private _timer: Nullable<Timer>;

    constructor(readonly interval: number = 1000) {
        super();
    }

    public get elapsed() { return this._state.value?.elapsed ?? 0; }
    public get left() { return this._state.value?.left ?? 0; }
    public get now() { return this._state.value?.now ?? 0; }
    public get enabled() { return this._enabled.value; }

    public start = action((duration: number) => {
        this.dispose();
        this._timer = new Timer(this.interval, false)
            .withDuration(duration);

        // subscribe & cleanup
        this.disposer.add(
            this._timer.on(this._onTick)
        );
        this.disposer.add(
            this._timer.onFinished.on((data) => {
                this._state.setValue(data);
                this._enabled.setFalse();
            })
        );
        this.disposer.add(this._timer);
        this.disposer.add(() => {
            this._timer = null;
            this._enabled.setFalse();
        });

        // start
        this._timer.restart();
        this._enabled.setTrue();
    });

    public stop = () => {
        this.dispose();
    };

    private _onTick = action((state?: TimerState) => {
        this._state.setValue(state);
    });
}
