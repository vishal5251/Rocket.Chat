import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import type { Logger } from '../app/logger/server';

const CallbackPriority = {
	HIGH: -1000,
	MEDIUM: 0,
	LOW: 1000,
} as const;

class Callbacks {
	logger: Logger | null = null;

	timed = false;

	priority = CallbackPriority;

	callbacks: {
		[hook: string]: any;
	} = {};

	combinedCallbacks = new Map<string, any>();

	getHooks(hookName: string): any[] {
		return this.callbacks[hookName] || [];
	}

	add(_hook: string, _callback: any, _priority?: number, _id?: string): void {
		throw new Error('not implemented');
	}

	remove(_hook: string, _id: string): void {
		throw new Error('not implemented');
	}

	runItem({ callback, result, constant }: { hook: string; callback: any; result: any; constant?: any }): any {
		return callback(result, constant);
	}

	/**
	 * Successively run all of a hook's callbacks on an item
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constant - An optional constant that will be passed along to each callback
	 * @returns Returns the item after it's been through all the callbacks for this hook
	 */
	run(hook: string, item: any, constant?: any): any {
		const runner = this.combinedCallbacks.get(hook);
		if (!runner) {
			return item;
		}

		return runner(item, constant);
	}

	/**
	 * Successively run all of a hook's callbacks on an item, in async mode
	 * @param hook - The name of the hook
	 * @param item - The post, comment, modifier, etc. on which to run the callbacks
	 * @param constant - An optional constant that will be passed along to each callback
	 */
	runAsync(hook: string, item: any, constant?: any): void {
		const callbackItems = this.callbacks[hook];
		if (callbackItems?.length) {
			callbackItems.forEach((callback: any) => Meteor.defer(() => callback(item, constant)));
		}
	}
}

export const callbacks = new Callbacks();

const wrapCallback = (callback: any) => (...args: any[]): any => {
	const time = Date.now();
	const result = callback(...args);
	const currentTime = Date.now() - time;
	let stack = callback.stack
		&& typeof callback.stack.split === 'function'
		&& callback.stack.split('\n');
	stack = stack && stack[2] && (stack[2].match(/\(.+\)/) || [])[0];
	console.log(String(currentTime), callback.hook, callback.id, stack);
	return result;
};

const wrapRun = (hook: string, fn: any) => (...args: any[]): any => {
	const time = Date.now();
	const ret = fn(...args);
	const totalTime = Date.now() - time;
	console.log(`${ hook }:`, totalTime);
	return ret;
};

const handleResult = (fn: any) => (result: any, constant: any): any => {
	callbacks.logger && callbacks.logger.debug(`Executing callback with id ${ fn.id } for hook ${ fn.hook }`);
	const callbackResult = callbacks.runItem({ hook: fn.hook, callback: fn, result, constant });
	return typeof callbackResult === 'undefined' ? result : callbackResult;
};

const pipe = (f: any, g: any) => (e: any, ...constants: any[]): any => g(f(e, ...constants), ...constants);
const createCallback = (_hook: string, callbacks: any): any => callbacks.map(handleResult).reduce(pipe);

const createCallbackTimed = (hook: string, callbacks: any): any =>
	wrapRun(hook,
		callbacks
			.map(wrapCallback)
			.map(handleResult)
			.reduce(pipe),
	);

const create = (hook: string, cbs: any[]): any =>
	(callbacks.timed ? createCallbackTimed(hook, cbs) : createCallback(hook, cbs));

const getHooks = (hookName: string): any[] => callbacks.callbacks[hookName] || [];

/**
 * Add a callback function to a hook
 * @param {String} hook - The name of the hook
 * @param {Function} callback - The callback function
 * @param {CallbackPriority} priority - The callback run priority (order)
 * @param {String} id - Human friendly name for this callback
 */
callbacks.add = function(
	hook,
	callback,
	priority = callbacks.priority.MEDIUM,
	id = Random.id(),
): void {
	callbacks.callbacks[hook] = getHooks(hook);
	if (callbacks.callbacks[hook].find((cb: any) => cb.id === id)) {
		return;
	}
	callback.hook = hook;
	callback.priority = priority;
	callback.id = id;
	callback.stack = new Error().stack;

	callbacks.callbacks[hook].push(callback);
	callbacks.callbacks[hook] = callbacks.callbacks[hook].sort(({ priority: a }: { priority?: number }, { priority: b }: { priority?: number }) => (a || callbacks.priority.MEDIUM) - (b || callbacks.priority.MEDIUM));
	callbacks.combinedCallbacks.set(hook, create(hook, callbacks.callbacks[hook]));
};

/*
* Remove a callback from a hook
* @param {string} hook - The name of the hook
* @param {string} id - The callback's id
*/
callbacks.remove = function(hook, id): void {
	callbacks.callbacks[hook] = callbacks.getHooks(hook).filter((callback) => callback.id !== id);
	callbacks.combinedCallbacks.set(hook, create(hook, callbacks.callbacks[hook]));
};
