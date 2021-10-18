import { Callback } from './Callback';

export interface ICallbackWrapper {
	wrap<I, K extends unknown[]>(
		hook: string,
		chainedCallback: (item: I, ...constants: K) => I,
		callbackCount: number,
	): (item: I, ...constants: K) => I;

	wrapOne<I, K extends unknown[]>(
		hook: string,
		callback: Callback<I, K>,
	): (item: I, ...constants: K) => I;
}
