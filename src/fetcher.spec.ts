import { describe, expect, it, vi } from "vitest";
import { createFetcher } from "./fetcher.js";
import type { EnfetchPlugin } from "./types.js";

describe("createFetcher", () => {
	it("should create a basic fetcher without plugins", async () => {
		expect.assertions(2);

		const mockFetch = vi.fn().mockResolvedValue(new Response("OK"));
		const fetcher = createFetcher({ fetcher: mockFetch });

		const req = new Request("https://example.com");
		const res = await fetcher(req);

		expect(res).toBeInstanceOf(Response);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("should execute onAfterResponse hook", async () => {
		expect.assertions(2);

		const mockFetch = vi.fn().mockResolvedValue(new Response("OK"));
		const onAfterResponse = vi.fn();

		const plugin: EnfetchPlugin = {
			name: "test-plugin",
			onAfterResponse,
		};

		const fetcher = createFetcher({ plugins: [plugin], fetcher: mockFetch });

		const req = new Request("https://example.com");
		const res = await fetcher(req);

		expect(onAfterResponse).toHaveBeenCalledTimes(1);
		expect(onAfterResponse).toHaveBeenCalledWith(res, expect.any(Request));
	});

	it("should execute onError hook when fetch throws", async () => {
		expect.assertions(2);

		const error = new Error("Network error");
		const mockFetch = vi.fn().mockRejectedValue(error);
		const onError = vi.fn();

		const plugin: EnfetchPlugin = {
			name: "test-plugin",
			onError,
		};

		const fetcher = createFetcher({ plugins: [plugin], fetcher: mockFetch });

		const req = new Request("https://example.com");

		await expect(fetcher(req)).rejects.toThrow("Network error");
		expect(onError).toHaveBeenCalledWith(expect.any(Request), error);
	});

	it("should execute multiple plugins in order", async () => {
		expect.assertions(1);

		const mockFetch = vi.fn().mockResolvedValue(new Response("OK"));
		const order: string[] = [];

		const plugin1: EnfetchPlugin = {
			name: "plugin1",
			onBeforeRequest: (req) => {
				order.push("plugin1-before");
				return req;
			},
			onAfterResponse: () => {
				order.push("plugin1-after");
			},
		};

		const plugin2: EnfetchPlugin = {
			name: "plugin2",
			onBeforeRequest: (req) => {
				order.push("plugin2-before");
				return req;
			},
			onAfterResponse: () => {
				order.push("plugin2-after");
			},
		};

		const fetcher = createFetcher({
			plugins: [plugin1, plugin2],
			fetcher: mockFetch,
		});

		const req = new Request("https://example.com");
		await fetcher(req);

		expect(order).toEqual([
			"plugin1-before",
			"plugin2-before",
			"plugin1-after",
			"plugin2-after",
		]);
	});

	it("should clone request before passing to hooks", async () => {
		expect.assertions(1);

		const mockFetch = vi.fn().mockResolvedValue(new Response("OK"));
		let receivedReq: Request | null = null;

		const plugin: EnfetchPlugin = {
			name: "test-plugin",
			onBeforeRequest: (req) => {
				receivedReq = req;
				return req;
			},
		};

		const fetcher = createFetcher({ plugins: [plugin], fetcher: mockFetch });

		const originalReq = new Request("https://example.com");
		await fetcher(originalReq);

		expect(receivedReq).not.toBe(originalReq);
	});

	it("should execute all error hooks when fetch fails", async () => {
		expect.assertions(3);

		const error = new Error("Network error");
		const mockFetch = vi.fn().mockRejectedValue(error);
		const onError1 = vi.fn();
		const onError2 = vi.fn();

		const plugin1: EnfetchPlugin = {
			name: "plugin1",
			onError: onError1,
		};

		const plugin2: EnfetchPlugin = {
			name: "plugin2",
			onError: onError2,
		};

		const fetcher = createFetcher({
			plugins: [plugin1, plugin2],
			fetcher: mockFetch,
		});

		const req = new Request("https://example.com");

		await expect(fetcher(req)).rejects.toThrow("Network error");
		expect(onError1).toHaveBeenCalledTimes(1);
		expect(onError2).toHaveBeenCalledTimes(1);
	});
});
