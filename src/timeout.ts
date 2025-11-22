import type { EnfetchPlugin } from "./types.js";

export const timeout = (ms: number): EnfetchPlugin => {
	return {
		name: "timeout",
		onBeforeRequest: (req) => {
			const controller = new AbortController();
			setTimeout(() => controller.abort(), ms);

			const newReq = new Request(req, {
				signal: AbortSignal.any([req.signal, controller.signal]),
			});
			return newReq;
		},
	};
};
