export type Callback<I, K> = {
	(item: I, constant?: K): I;
	hook: string;
	priority: number;
	id: string;
	stack?: string;
};
