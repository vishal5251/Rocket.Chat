import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { Callback } from './Callback';
import { CallbackPriority } from './CallbackPriority';
import { DefaultCallbackWrapper } from './DefaultCallbackWrapper';
import { ICallbackWrapper } from './ICallbackWrapper';

const pipe =
	<I, K extends unknown[]>(
		f: (item: I, ...constants: K) => I,
		g: (item: I, ...constants: K) => I,
	) =>
	(item: I, ...constants: K): I =>
		g(f(item, ...constants), ...constants);

/** @deprecated */
export class Callbacks {
	readonly priority = CallbackPriority;

	private callbacksByHook = new Map<string, Callback<any, any[]>[]>();

	private chainedCallbacksByHook = new Map<string, <I>(item: I, ...constants: any[]) => I>();

	private parallelCallbacksByHook = new Map<string, <I>(item: I, ...constants: any[]) => void>();

	private createChainedCallback<I, K extends unknown[]>(
		hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, ...constants: K) => I {
		const { wrapper } = this;

		const chainedCallback = callbacks
			.map((callback) => wrapper.wrapOne(hook, callback))
			.reduce(pipe);

		return wrapper.wrap(hook, chainedCallback, callbacks.length);
	}

	private createParallelCallback<I, K extends unknown[]>(
		hook: string,
		callbacks: Callback<I, K>[],
	): (item: I, ...constants: K) => void {
		const { wrapper } = this;

		const wrappedCallbacks = callbacks.map((callback) => wrapper.wrapOne(hook, callback));

		return (item: I, ...constants: K): void => {
			wrappedCallbacks.forEach((callback) => {
				Meteor.defer(() => {
					callback(item, ...constants);
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

		const combinedCallback = this.createChainedCallback(hook, callbacks);
		this.chainedCallbacksByHook.set(hook, combinedCallback);

		const parallelCallback = this.createParallelCallback(hook, callbacks);
		this.parallelCallbacksByHook.set(hook, parallelCallback);
	}

	wrapper: ICallbackWrapper = new DefaultCallbackWrapper();

	/**
	 * Add a callback function to a hook
	 * @param hook - The name of the hook
	 * @param callback - The callback function
	 * @param priority - The callback run priority (order)
	 * @param id - Human friendly name for this callback
	 */
	add<F extends (item: any, ...constants: any[]) => any>(
		hook: string,
		callback: F,
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

	/**
	 * Successively run all of a hook's callbacks on an item
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constants - Optional constants that will be passed along to each callback
	 * @returns Returns the item after it's been through all the callbacks for this hook
	 */
	run<I>(hook: string, item: I, ...constants: any[]): I {
		const combinedCallback = this.chainedCallbacksByHook.get(hook);
		return combinedCallback?.<I>(item, ...constants) ?? item;
	}

	/**
	 * Successively run all of a hook's callbacks on an item, in async mode
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constants - Optional constants that will be passed along to each callback
	 */
	runAsync<I>(hook: string, item: I, ...constants: any[]): void {
		const parallelCallback = this.parallelCallbacksByHook.get(hook);
		parallelCallback?.<I>(item, ...constants);
	}
}
