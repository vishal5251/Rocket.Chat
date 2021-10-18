import { Callback } from './Callback';

export interface ICallbackWrapper {
	wrap<I, K>(
		hook: string,
		chainedCallback: (item: I, constant?: K) => I,
		callbackCount: number,
	): (item: I, constant?: K) => I;

	wrapOne<I, K>(hook: string, callback: Callback<I, K>): (item: I, constant?: K) => I;
}
