import { Callback } from './Callback';
import { ICallbackRunner } from './ICallbackRunner';

export interface ICallbackWrapper {
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
