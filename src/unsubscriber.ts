import logger from './logger';

export {
    IDisposable,
    DisposeFunction as Disposer,
    combineDisposers,
    Disposer as Unsubscriber,
    Disposable,
} from './disposer';

logger.warn('@zajno/common: importing module "unsusbcriber" is deprecated; please change your import to "disposer" module.');
