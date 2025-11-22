import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { timeout } from "./timeout.js";

describe("timeout", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should create a plugin with name 'timeout'", () => {
		const plugin = timeout(5000);
		expect(plugin.name).toBe("timeout");
	});

	it("should add timeout signal to request", async () => {
		expect.assertions(2);

		const plugin = timeout(5000);
		const req = new Request("https://example.com");

		const result = await plugin.onBeforeRequest?.(req);

		expect(result).toBeInstanceOf(Request);
		expect(result?.signal).toBeDefined();
	});

	it("should preserve existing request signal", async () => {
		expect.assertions(2);

		const plugin = timeout(5000);
		const controller = new AbortController();
		const req = new Request("https://example.com", {
			signal: controller.signal,
		});

		const result = await plugin.onBeforeRequest?.(req);

		expect(result).toBeInstanceOf(Request);
		expect(result?.signal).toBeDefined();
	});

	it("should abort request when timeout is exceeded", async () => {
		expect.assertions(2);

		const plugin = timeout(1000);
		const req = new Request("https://example.com");

		const result = await plugin.onBeforeRequest?.(req);

		expect(result?.signal?.aborted).toBeFalsy();

		vi.advanceTimersByTime(1000);

		expect(result?.signal?.aborted).toBeTruthy();
	});

	it("should not abort request before timeout", async () => {
		expect.assertions(1);

		const plugin = timeout(5000);
		const req = new Request("https://example.com");

		const result = await plugin.onBeforeRequest?.(req);

		vi.advanceTimersByTime(4999);

		expect(result?.signal?.aborted).toBeFalsy();
	});
});
