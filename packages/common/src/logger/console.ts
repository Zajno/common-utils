import { ILogger } from './types.js';
import { NamedLogger } from './named.js';

export const CONSOLE: ILogger = console;

export class ConsoleLogger extends NamedLogger {
    protected get implementation() { return CONSOLE; }
}
