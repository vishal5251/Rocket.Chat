export type Callback<I, K extends unknown[]> = {
	(item: I, ...constants: K): I;
	hook: string;
	priority: number;
	id: string;
	stack?: string;
};
