import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import type { Logger } from '../app/logger/server';

const CallbackPriority = {
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

const pipe =
	<I, K>(f: (item: I, constant?: K) => I, g: (item: I, constant?: K) => I) =>
	(item: I, constant?: K): I =>
		g(f(item, constant), constant);

class Callbacks {
	logger: Logger | null = null;

	timed = false;

	priority = CallbackPriority;

	private callbacksByHook = new Map<string, Callback<any, any>[]>();

	private combinedCallbacksByHook = new Map<string, (...args: any[]) => any>();

	private wrapDefault<I, K>(callback: Callback<I, K>): (item: I, constant?: K) => I {
		return (item: I, constant?: K): I =>
			this.runItem({
				hook: callback.hook,
				callback,
				result: item,
				constant,
			});
	}

	private combineCallbacksDefault<I, K>(
		_hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, constant?: K) => I {
		return callbacks.map(this.wrapDefault).reduce(pipe);
	}

	private wrapLogged<I, K>(callback: Callback<I, K>): (item: I, constant?: K) => I {
		const next = this.wrapDefault(callback);

		return (item: I, constant?: K): I => {
			this.logger?.debug(`Executing callback with id ${callback.id} for hook ${callback.hook}`);
			return next(item, constant);
		};
	}

	private combineCallbacksLogged<I, K>(
		_hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, constant?: K) => I {
		return callbacks.map(this.wrapLogged).reduce(pipe);
	}

	private wrapRun<I, K>(hook: string, callback: (item: I, constant?: K) => I) {
		return (item: I, constant?: K): I => {
			const time = Date.now();
			const ret = callback(item, constant);
			const totalTime = Date.now() - time;
			console.log(`${hook}:`, totalTime);
			return ret;
		};
	}

	private wrapTimed<I, K>(callback: Callback<I, K>): (item: I, constant?: K) => I {
		const next = this.wrapDefault(callback);

		return (item: I, constant?: K): I => {
			const time = Date.now();
			const result = next(item, constant);
			const currentTime = Date.now() - time;
			const stack = callback.stack?.split?.('\n')?.[2]?.match(/\(.+\)/)?.[0];
			console.log(String(currentTime), callback.hook, callback.id, stack);
			return result;
		};
	}

	private combineCallbacksTimed<I, K>(
		hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, constant?: K) => I {
		return this.wrapRun(hook, callbacks.map(this.wrapTimed).reduce(pipe));
	}

	private combineCallbacks<I, K>(
		hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, constant?: K) => I {
		if (this.timed) {
			return this.combineCallbacksTimed(hook, callbacks);
		}

		if (this.logger) {
			return this.combineCallbacksLogged(hook, callbacks);
		}

		return this.combineCallbacksDefault(hook, callbacks);
	}

	private updateCombinedCallback(hook: string): void {
		const callbacks = this.callbacksByHook.get(hook) ?? [];
		const combinedCallback = this.combineCallbacks(hook, callbacks);
		this.combinedCallbacksByHook.set(hook, combinedCallback);
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

		this.updateCombinedCallback(hook);
	}

	/**
	 * Remove a callback from a hook
	 * @param hook - The name of the hook
	 * @param id - The callback's id
	 */
	remove(hook: string, id: string): void {
		const callbacks =
			this.callbacksByHook.get(hook)?.filter((callback) => callback.id !== id) ?? [];
		this.callbacksByHook.set(hook, callbacks);

		this.updateCombinedCallback(hook);
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
		const combinedCallback = this.combinedCallbacksByHook.get(hook);
		return combinedCallback?.(item, constant) ?? item;
	}

	/**
	 * Successively run all of a hook's callbacks on an item, in async mode
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constant - An optional constant that will be passed along to each callback
	 */
	runAsync<I, K>(hook: string, item: I, constant?: K): void {
		const callbacks = this.callbacksByHook.get(hook);
		callbacks?.forEach((cb) => {
			Meteor.defer(() => {
				cb(item, constant);
			});
		});
	}
}

export const callbacks = new Callbacks();
