import type { Callback } from './Callback';
import type { ICallbackWrapper } from './ICallbackWrapper';

/** @deprecated */
export class DefaultCallbackWrapper implements ICallbackWrapper {
	wrap<I, K extends unknown[]>(
		_hook: string,
		chainedCallback: (item: I, ...constants: K) => I,
	): (item: I, ...constants: K) => I {
		return chainedCallback;
	}

	wrapOne<I, K extends unknown[]>(
		_hook: string,
		callback: Callback<I, K>,
	): (item: I, ...constants: K) => I {
		return callback;
	}
}
