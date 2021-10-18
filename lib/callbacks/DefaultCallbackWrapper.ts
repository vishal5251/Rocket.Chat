import type { Callback } from './Callback';
import type { ICallbackWrapper } from './ICallbackWrapper';

/** @deprecated */
export class DefaultCallbackWrapper implements ICallbackWrapper {
	wrap<I, K>(
		_hook: string,
		chainedCallback: (item: I, constant?: K) => I,
	): (item: I, constant?: K) => I {
		return chainedCallback;
	}

	wrapOne<I, K>(_hook: string, callback: Callback<I, K>): (item: I, constant?: K) => I {
		return callback;
	}
}
