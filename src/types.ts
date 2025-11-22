export type Enfetch = (req: Request) => Promise<Response>;

type OnBeforeRequest = (
	req: Request,
) => Promise<Request> | Request | Promise<void> | void;

type OnAfterResponse = (res: Response, req: Request) => Promise<void> | void;

type OnError = (req: Request, err: unknown) => Promise<void> | void;

export type EnfetchPlugin = {
	name: string;
	onBeforeRequest?: OnBeforeRequest;
	onAfterResponse?: OnAfterResponse;
	onError?: OnError;
};

export type RetryContext = {
	retries: number;
	req: Request;
} & ({ isError: true; error: unknown } | { isError: false; res: Response });

export type ShouldRetry = (context: RetryContext) => Promise<boolean> | boolean;

export type DelayFn = (context: RetryContext) => number;
export type RetryOptions = {
	maxRetries?: number;
	delay?: DelayFn | number;
	shouldRetry?: ShouldRetry;
};

export type CreateFetcher = (opts?: {
	plugins?: EnfetchPlugin[];
	fetcher?: typeof fetch;
}) => Enfetch;

export type CreateRetryFetcher = (
	fetcher: Enfetch,
	options: RetryOptions,
) => Enfetch;
