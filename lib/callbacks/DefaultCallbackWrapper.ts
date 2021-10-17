import type { Callback } from './Callback';
import type { ICallbackRunner } from './ICallbackRunner';
import type { ICallbackWrapper } from './ICallbackWrapper';

export class DefaultCallbackWrapper implements ICallbackWrapper {
	wrap<I, K>(
		_hook: string,
		chainedCallback: (item: I, constant?: K) => I,
	): (item: I, constant?: K) => I {
		return chainedCallback;
	}

	wrapOne<I, K>(
		runner: ICallbackRunner,
		hook: string,
		callback: Callback<I, K>,
	): (item: I, constant?: K) => I {
		return (item: I, constant?: K): I =>
			runner.runItem({
				hook,
				callback,
				result: item,
				constant,
			});
	}
}
