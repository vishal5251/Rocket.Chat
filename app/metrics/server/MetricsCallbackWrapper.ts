import type { ICallbackWrapper } from '../../../lib/callbacks/ICallbackWrapper';
import type { Callback } from '../../../lib/callbacks/Callback';
import { metrics } from './lib/metrics';
import StatsTracker from './lib/statsTracker';

export class MetricsCallbackWrapper implements ICallbackWrapper {
	private innerWrapper: ICallbackWrapper;

	constructor(innerWrapper: ICallbackWrapper) {
		this.innerWrapper = innerWrapper;
	}

	wrap<I, K extends unknown[]>(hook: string, chainedCallback: (item: I, ...constants: K) => I, callbackCount: number): (item: I, ...constants: K) => I {
		const innerCallback = this.innerWrapper.wrap(hook, chainedCallback, callbackCount);

		return (item: I, ...constants: K): I => {
			const rocketchatHooksEnd = metrics.rocketchatHooks.startTimer({
				hook,
				// eslint-disable-next-line @typescript-eslint/camelcase
				callbacks_length: callbackCount,
			});
			const next = innerCallback(item, ...constants);
			rocketchatHooksEnd();
			return next;
		};
	}

	wrapOne<I, K extends unknown[]>(hook: string, callback: Callback<I, K>): (item: I, ...constants: K) => I {
		return (item: I, ...constants: K): I => {
			const time = Date.now();

			const rocketchatCallbacksEnd = metrics.rocketchatCallbacks.startTimer({ hook, callback: callback.id });

			const newResult = callback(item, ...constants);

			StatsTracker.timing('callbacks.time', Date.now() - time, [
				`hook:${ hook }`,
				`callback:${ callback.id }`,
			]);

			rocketchatCallbacksEnd();

			return newResult;
		};
	}
}
