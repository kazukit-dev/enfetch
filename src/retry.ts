import type { CreateRetryFetcher, ShouldRetry } from "./types.js";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_DELAY = 0;
const DEFAULT_RETRY_STATUS_CODES = [429, 500, 502, 503, 504];

export const defaultShouldRetry: ShouldRetry = (ctx) => {
	if (ctx.isError) {
		return true;
	}
	return DEFAULT_RETRY_STATUS_CODES.includes(ctx.res.status);
};

const sleep = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createRetryClient: CreateRetryFetcher = (fetcher, options) => {
	const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
	const delay = options.delay ?? DEFAULT_DELAY;
	const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

	return async (req: Request) => {
		let retries = 0;

		do {
			try {
				const res = await fetcher(req.clone());

				const context = { retries, req, isError: false as const, res };
				const retry = await shouldRetry(context);

				if (!retry || retries >= maxRetries) {
					return res;
				}

				// Calculate delay
				const delayMs = typeof delay === "function" ? delay(context) : delay;
				if (delayMs > 0) {
					await sleep(delayMs);
				}

				retries++;
			} catch (error: unknown) {
				const context = { retries, req, isError: true as const, error };
				const retry = await shouldRetry(context);

				if (!retry || retries >= maxRetries) {
					throw error;
				}

				// Calculate delay
				const delayMs = typeof delay === "function" ? delay(context) : delay;
				if (delayMs > 0) {
					await sleep(delayMs);
				}

				retries++;
			}
		} while (retries <= maxRetries);

		// Should never reach here, but for type safety
		throw new Error("Unexpected retry state");
	};
};
