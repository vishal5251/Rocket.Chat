import type { Callback } from './Callback';
import type { ICallbackWrapper } from './ICallbackWrapper';

/** @deprecated */
export class TimedCallbackWrapper implements ICallbackWrapper {
	wrap<I, K extends unknown[]>(
		hook: string,
		chainedCallback: (item: I, ...constants: K) => I,
	): (item: I, ...constants: K) => I {
		return (item: I, ...constants: K): I => {
			const time = Date.now();
			const ret = chainedCallback(item, ...constants);
			const totalTime = Date.now() - time;
			console.log(`${hook}:`, totalTime);
			return ret;
		};
	}

	wrapOne<I, K extends unknown[]>(
		_hook: string,
		callback: Callback<I, K>,
	): (item: I, ...constants: K) => I {
		return (item: I, ...constants: K): I => {
			const time = Date.now();

			const result = callback(item, ...constants);

			const currentTime = Date.now() - time;
			const stack = callback.stack?.split?.('\n')?.[2]?.match(/\(.+\)/)?.[0];
			console.log(String(currentTime), callback.hook, callback.id, stack);
			return result;
		};
	}
}
