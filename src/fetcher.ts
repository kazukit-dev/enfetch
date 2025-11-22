import type { CreateFetcher } from "./types.js";

export const createFetcher: CreateFetcher = (opts) => {
	const plugins = opts?.plugins ?? [];
	const baseFetcher = opts?.fetcher ?? fetch;

	// Collect hooks
	const beforeRequestHooks = plugins
		.map((p) => p.onBeforeRequest)
		.filter((hook) => hook !== undefined);
	const afterResponseHooks = plugins
		.map((p) => p.onAfterResponse)
		.filter((hook) => hook !== undefined);
	const errorHooks = plugins
		.map((p) => p.onError)
		.filter((hook) => hook !== undefined);

	return async (req: Request) => {
		let currentReq = req.clone();

		// Execute onBeforeRequest hooks
		for (const hook of beforeRequestHooks) {
			const result = await hook(currentReq);
			if (result instanceof Request) {
				currentReq = result;
			}
		}

		try {
			// Execute the fetch
			const res = await baseFetcher(currentReq);

			// Execute onAfterResponse hooks
			for (const hook of afterResponseHooks) {
				await hook(res, currentReq);
			}

			return res;
		} catch (error: unknown) {
			// Execute onError hooks
			for (const hook of errorHooks) {
				await hook(currentReq, error);
			}

			throw error;
		}
	};
};
