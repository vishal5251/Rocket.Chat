import { Random } from 'meteor/random';

import { PromisePriority } from './callbacks/PromisePriority';

/** @deprecated */
class Promises {
	readonly priority = PromisePriority;

	callbacksByHook: any = {};

	/**
	 * Add a callback function to a hook
	 * @param hook - The name of the hook
	 * @param callback - The callback function
	 */
	add(
		hook: string,
		callback: any,
		priority: number = PromisePriority.MEDIUM,
		id: string = Random.id(),
	): void {
		const callbacks = this.callbacksByHook[hook] ?? [];

		if (callbacks.find((cb: any) => cb.id === id)) {
			return;
		}

		callback.priority = priority;
		callback.id = id;

		callbacks.push(callback);
		callbacks.sort(
			({ priority: a }: any, { priority: b }: any) =>
				(a || PromisePriority.MEDIUM) - (b || PromisePriority.MEDIUM),
		);

		this.callbacksByHook[hook] = callbacks;
	}

	/**
	 * Remove a callback from a hook
	 * @param hook - The name of the hook
	 * @param id - The callback's id
	 */
	remove(hook: string, id: string): void {
		this.callbacksByHook[hook] = this.callbacksByHook[hook].filter(
			(callback: any) => callback.id !== id,
		);
	}

	/**
	 * Successively run all of a hook's callbacks on an item
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constant - An optional constant that will be passed along to each callback
	 * @returns Returns the item after it's been through all the callbacks for this hook
	 */
	run<I, K>(hook: string, item: I, constant?: K): Promise<I> {
		const callbacks = this.callbacksByHook[hook];
		if (!callbacks || callbacks.length === 0) {
			return Promise.resolve(item);
		}

		return callbacks.reduce(
			(previousPromise: Promise<I>, callback: (item: I, constant?: K) => I) =>
				previousPromise.then((result: I) => callback(result, constant)),
			Promise.resolve(item),
		);
	}
}

/** @deprecated */
export const promises = new Promises();
