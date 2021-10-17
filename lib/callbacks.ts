import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import type { Logger } from '../app/logger/server';

export const CallbackPriority = {
	HIGH: -1000,
	MEDIUM: 0,
	LOW: 1000,
} as const;

type Callback<I, K> = {
	(item: I, constant?: K): I;
	hook: string;
	priority: number;
	id: string;
	stack?: string;
};

interface ICallbackRunner {
	runItem<I, K>({
		callback,
		result: item,
		constant,
	}: {
		hook: string;
		callback: (item: I, constant?: K) => I;
		result: I;
		constant?: K;
	}): I;
}

interface ICallbackWrapper {
	wrap<I, K>(
		hook: string,
		chainedCallback: (item: I, constant?: K) => I,
	): (item: I, constant?: K) => I;

	wrapOne<I, K>(
		runner: ICallbackRunner,
		hook: string,
		callback: Callback<I, K>,
	): (item: I, constant?: K) => I;
}

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

export class LoggingCallbackWrapper implements ICallbackWrapper {
	constructor(public logger: Logger) {}

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
		return (item: I, constant?: K): I => {
			this.logger?.debug(`Executing callback with id ${callback.id} for hook ${hook}`);
			return runner.runItem({
				hook,
				callback,
				result: item,
				constant,
			});
		};
	}
}

export class TimedCallbackWrapper implements ICallbackWrapper {
	wrap<I, K>(
		hook: string,
		chainedCallback: (item: I, constant?: K) => I,
	): (item: I, constant?: K) => I {
		return (item: I, constant?: K): I => {
			const time = Date.now();
			const ret = chainedCallback(item, constant);
			const totalTime = Date.now() - time;
			console.log(`${hook}:`, totalTime);
			return ret;
		};
	}

	wrapOne<I, K>(
		runner: ICallbackRunner,
		hook: string,
		callback: Callback<I, K>,
	): (item: I, constant?: K) => I {
		return (item: I, constant?: K): I => {
			const time = Date.now();

			const result = runner.runItem({
				hook,
				callback,
				result: item,
				constant,
			});

			const currentTime = Date.now() - time;
			const stack = callback.stack?.split?.('\n')?.[2]?.match(/\(.+\)/)?.[0];
			console.log(String(currentTime), callback.hook, callback.id, stack);
			return result;
		};
	}
}

const pipe =
	<I, K>(f: (item: I, constant?: K) => I, g: (item: I, constant?: K) => I) =>
	(item: I, constant?: K): I =>
		g(f(item, constant), constant);

class Callbacks implements ICallbackRunner {
	priority = CallbackPriority;

	wrapper = new DefaultCallbackWrapper();

	private callbacksByHook = new Map<string, Callback<any, any>[]>();

	private chainedCallbacksByHook = new Map<string, <I, K>(item: I, constant?: K) => I>();

	private parallelCallbacksByHook = new Map<string, <I, K>(item: I, constant?: K) => void>();

	private createChainedCallback<I, K>(
		runner: ICallbackRunner,
		hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, constant?: K) => I {
		const { wrapper } = this;

		const chainedCallback = callbacks
			.map((callback) => wrapper.wrapOne(runner, hook, callback))
			.reduce(pipe);

		return wrapper.wrap(hook, chainedCallback);
	}

	private createParallelCallback<I, K>(
		runner: ICallbackRunner,
		hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, constant?: K) => void {
		return (item: I, constant?: K): void => {
			callbacks?.forEach((callback) => {
				Meteor.defer(() => {
					runner.runItem({ callback, hook, result: item, constant });
				});
			});
		};
	}

	private updateCombinedCallbacks(hook: string): void {
		const callbacks = this.callbacksByHook.get(hook);

		if (!callbacks || callbacks.length === 0) {
			this.chainedCallbacksByHook.delete(hook);
			this.parallelCallbacksByHook.delete(hook);
			return;
		}

		const combinedCallback = this.createChainedCallback(this, hook, callbacks);
		this.chainedCallbacksByHook.set(hook, combinedCallback);

		const parallelCallback = this.createParallelCallback(this, hook, callbacks);
		this.parallelCallbacksByHook.set(hook, parallelCallback);
	}

	/**
	 * Add a callback function to a hook
	 * @param hook - The name of the hook
	 * @param callback - The callback function
	 * @param priority - The callback run priority (order)
	 * @param id - Human friendly name for this callback
	 */
	add<C extends (item: any, constant?: any) => any>(
		hook: string,
		callback: C,
		priority: number = CallbackPriority.MEDIUM,
		id: string = Random.id(),
	): void {
		const callbacks = this.callbacksByHook.get(hook) ?? [];
		if (callbacks.find((cb: any) => cb.id === id)) {
			return;
		}

		callbacks.push(
			Object.assign(callback, {
				hook,
				priority,
				id,
				stack: new Error().stack,
			}),
		);

		callbacks.sort(
			({ priority: a }, { priority: b }) =>
				(a || CallbackPriority.MEDIUM) - (b || CallbackPriority.MEDIUM),
		);

		this.callbacksByHook.set(hook, callbacks);

		this.updateCombinedCallbacks(hook);
	}

	/**
	 * Remove a callback from a hook
	 * @param hook - The name of the hook
	 * @param id - The callback's id
	 */
	remove(hook: string, id: string): void {
		const callbacks =
			this.callbacksByHook.get(hook)?.filter((callback) => callback.id !== id) ?? [];

		if (callbacks.length > 0) {
			this.callbacksByHook.set(hook, callbacks);
		} else {
			this.callbacksByHook.delete(hook);
		}

		this.updateCombinedCallbacks(hook);
	}

	runItem<I, K>({
		callback,
		result: item,
		constant,
	}: {
		hook: string;
		callback: (item: I, constant?: K) => I;
		result: I;
		constant?: K;
	}): I {
		const next = callback(item, constant);
		return typeof next === 'undefined' ? item : next;
	}

	/**
	 * Successively run all of a hook's callbacks on an item
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constant - An optional constant that will be passed along to each callback
	 * @returns Returns the item after it's been through all the callbacks for this hook
	 */
	run<I, K>(hook: string, item: I, constant?: K): I {
		const combinedCallback = this.chainedCallbacksByHook.get(hook);
		return combinedCallback?.<I, K>(item, constant) ?? item;
	}

	/**
	 * Successively run all of a hook's callbacks on an item, in async mode
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constant - An optional constant that will be passed along to each callback
	 */
	runAsync<I, K>(hook: string, item: I, constant?: K): void {
		const parallelCallback = this.parallelCallbacksByHook.get(hook);
		parallelCallback?.<I, K>(item, constant);
	}
}

export const callbacks = new Callbacks();
