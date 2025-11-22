import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRetryClient, defaultShouldRetry } from "./retry.js";
import type { Enfetch } from "./types.js";

describe("defaultShouldRetry", () => {
	it("should return true for network errors", () => {
		expect.assertions(1);

		const result = defaultShouldRetry({
			retries: 0,
			req: new Request("https://example.com"),
			isError: true,
			error: new Error("Network error"),
		});

		expect(result).toBeTruthy();
	});

	it("should return true for retryable status codes", () => {
		expect.assertions(1);

		const result = defaultShouldRetry({
			retries: 0,
			req: new Request("https://example.com"),
			isError: false,
			res: new Response(null, { status: 500 }),
		});

		expect(result).toBeTruthy();
	});

	it("should return false for successful responses", () => {
		expect.assertions(1);

		const result = defaultShouldRetry({
			retries: 0,
			req: new Request("https://example.com"),
			isError: false,
			res: new Response(null, { status: 200 }),
		});

		expect(result).toBeFalsy();
	});
});

describe("createRetryClient", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return response on first success", async () => {
		expect.assertions(2);

		const mockFetch: Enfetch = vi
			.fn()
			.mockResolvedValue(new Response("OK", { status: 200 }));
		const client = createRetryClient(mockFetch, {});

		const req = new Request("https://example.com");
		const res = await client(req);

		expect(res.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("should retry on 500 status and eventually succeed", async () => {
		expect.assertions(2);

		const mockFetch: Enfetch = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 500 }))
			.mockResolvedValueOnce(new Response("OK", { status: 200 }));

		const client = createRetryClient(mockFetch, {});

		const req = new Request("https://example.com");
		const res = await client(req);

		await vi.runAllTimersAsync();

		expect(res.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("should retry on network error and eventually succeed", async () => {
		expect.assertions(2);

		const mockFetch: Enfetch = vi
			.fn()
			.mockRejectedValueOnce(new Error("Network error"))
			.mockResolvedValueOnce(new Response("OK", { status: 200 }));

		const client = createRetryClient(mockFetch, {});

		const req = new Request("https://example.com");
		const res = await client(req);

		await vi.runAllTimersAsync();

		expect(res.status).toBe(200);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("should respect maxRetries option", async () => {
		expect.assertions(2);

		const mockFetch: Enfetch = vi
			.fn()
			.mockResolvedValue(new Response(null, { status: 500 }));

		const client = createRetryClient(mockFetch, { maxRetries: 2 });

		const req = new Request("https://example.com");
		const res = await client(req);

		await vi.runAllTimersAsync();

		expect(res.status).toBe(500);
		expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
	});

	it("should throw error after max retries on network error", async () => {
		expect.assertions(2);

		const error = new Error("Network error");
		const mockFetch: Enfetch = vi.fn().mockRejectedValue(error);

		const client = createRetryClient(mockFetch, { maxRetries: 2 });

		const req = new Request("https://example.com");

		await expect(client(req)).rejects.toThrow("Network error");

		await vi.runAllTimersAsync();

		expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
	});

	it("should apply delay between retries", async () => {
		expect.assertions(3);

		const mockFetch: Enfetch = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 500 }))
			.mockResolvedValueOnce(new Response("OK", { status: 200 }));

		const client = createRetryClient(mockFetch, { delay: 1000 });

		const req = new Request("https://example.com");
		const promise = client(req);

		expect(mockFetch).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1000);

		expect(mockFetch).toHaveBeenCalledTimes(2);

		const res = await promise;
		expect(res.status).toBe(200);
	});

	it("should use DelayFn for dynamic delay", async () => {
		expect.assertions(2);

		const mockFetch: Enfetch = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 500 }))
			.mockResolvedValueOnce(new Response(null, { status: 500 }))
			.mockResolvedValueOnce(new Response("OK", { status: 200 }));

		const delayFn = vi.fn((ctx) => ctx.retries * 1000);

		const client = createRetryClient(mockFetch, { delay: delayFn });

		const req = new Request("https://example.com");
		const promise = client(req);

		await vi.advanceTimersByTimeAsync(0); // First retry, retries=0, delay=0
		await vi.advanceTimersByTimeAsync(1000); // Second retry, retries=1, delay=1000

		const res = await promise;

		expect(res.status).toBe(200);
		expect(delayFn).toHaveBeenCalledTimes(2);
	});

	it("should use custom shouldRetry function", async () => {
		expect.assertions(2);

		const mockFetch: Enfetch = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 404 }))
			.mockResolvedValueOnce(new Response("OK", { status: 200 }));

		const shouldRetry = vi.fn((ctx) => {
			if (ctx.isError) {
				return false;
			}
			return ctx.res.status === 404;
		});

		const client = createRetryClient(mockFetch, { shouldRetry });

		const req = new Request("https://example.com");
		const res = await client(req);

		await vi.runAllTimersAsync();

		expect(res.status).toBe(200);
		expect(shouldRetry).toHaveBeenCalledTimes(2);
	});
});
