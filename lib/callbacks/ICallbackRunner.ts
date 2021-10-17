export interface ICallbackRunner {
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
