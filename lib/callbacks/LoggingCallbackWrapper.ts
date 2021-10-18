import type { Logger } from '../../app/logger/server';
import type { Callback } from './Callback';
import type { ICallbackWrapper } from './ICallbackWrapper';

/** @deprecated */
export class LoggingCallbackWrapper implements ICallbackWrapper {
	constructor(public logger: Logger) {}

	wrap<I, K extends unknown[]>(
		_hook: string,
		chainedCallback: (item: I, ...constants: K) => I,
	): (item: I, ...constants: K) => I {
		return chainedCallback;
	}

	wrapOne<I, K extends unknown[]>(
		hook: string,
		callback: Callback<I, K>,
	): (item: I, ...constants: K) => I {
		return (item: I, ...constants: K): I => {
			this.logger?.debug(`Executing callback with id ${callback.id} for hook ${hook}`);
			return callback(item, ...constants);
		};
	}
}
