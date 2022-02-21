import logger from 'logger';

type ExecutionTime = {
    seconds: number;
    minutes: number;
    hours: number;
};

export class ProgressBar {
    private _itemExecutionStartedAt: number = null;
    private _averateItemUpdateTime: number = null;

    private _progressBarString: string = null;
    private _progressBarCursor: number = null;

    constructor (private readonly _size: number, private _cursor: number = 0) {
        logger.log('[ProgressBar]: init...');
    }

    private _getExecutionTimes(average: number, totalItems: number): [ExecutionTime, ExecutionTime] {
        const totalExecutionTime = totalItems * average;

        const itemAverage = this._convertAverageToTime(average);
        const totalExecution = this._convertAverageToTime(totalExecutionTime);

        return [itemAverage, totalExecution];
    }

    private _getExecutionTimeString(executionTime: ExecutionTime): string {
        let itemUpdatingTimeString = '';

        if (executionTime.hours) {
            itemUpdatingTimeString += `${executionTime.hours}h `;
        }

        if (executionTime.minutes) {
            itemUpdatingTimeString += `${executionTime.minutes}m `;
        }

        if (executionTime.seconds) {
            itemUpdatingTimeString += `${executionTime.seconds}s`;
        }

        return itemUpdatingTimeString;
    }

    private _convertAverageToTime(average: number): ExecutionTime {
        const inSeconds = average / 1000;

        let result: ExecutionTime;

        if (inSeconds < 60) {
            result = {
                seconds: inSeconds,
                minutes: null,
                hours: null,
            };
        } else if (inSeconds >= 60 && inSeconds < 3600) {
            result = {
                minutes: Math.trunc(inSeconds / 60),
                seconds: inSeconds % 60,
                hours: null,
            };
        } else if (inSeconds >= 3600) {
            const inMinutes = inSeconds / 60;

            result = {
                hours: Math.trunc(inMinutes / 60),
                minutes: inMinutes % 60,
                seconds: null,
            };
        }

        return result;
    }

    private _getProgressString(executedInPercents: number, cursor: number, totalItems: number): string {
        const executed = '#'.repeat(executedInPercents);
        const notExecuted = '-'.repeat(100 - executedInPercents);

        const progressString = `[ProgressBar]: [${executed}${notExecuted}] ${cursor}/${totalItems}`;

        return progressString;
    }

    private _getProgressBar(cursor: number, totalItems: number): string {
        const executedItemsInPercentages = Math.trunc((cursor / (totalItems)) * 100);

        if (this._progressBarCursor !== executedItemsInPercentages) {
            this._progressBarCursor = executedItemsInPercentages;

            this._progressBarString = this._getProgressString(executedItemsInPercentages, cursor, totalItems);
        }

        return this._progressBarString;
    }

    increment () {
        this._cursor++;

        if (this._itemExecutionStartedAt) {
            this._averateItemUpdateTime = Date.now() - this._itemExecutionStartedAt;
        }

        const progressString = this._getProgressBar(this._cursor, this._size);

        this._itemExecutionStartedAt = Date.now();
        logger.log(progressString);

        if (this._averateItemUpdateTime) {
            const [itemExecutionTime, totalExecution] = this._getExecutionTimes(this._averateItemUpdateTime, this._size);

            const itemExecutionString = this._getExecutionTimeString(itemExecutionTime);
            const totalExecutionString = this._getExecutionTimeString(totalExecution);

            logger.log(`[ProgressBar]: Item execution time: ${itemExecutionString} | Total execution time: ${totalExecutionString}`);
        }
    }
}
