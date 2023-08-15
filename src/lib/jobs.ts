// this is the jobs thing, this will handle the "jobs"

import { randomInt, sleep } from "@utils";
import EventEmitter from "./EventEmitter";

const ticker = new EventEmitter();
const tick = ticker.emit.bind(ticker, "tick");

class DefferedPromise<T = any> {
	resolve!: (value: T) => void;
	reject!: (reason?: any) => void;
	promise: Promise<T>;

	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}
}

async function simulateProgress(ms: number, cb: Function) {
	const start = Date.now();
	while (Date.now() - start < ms) {
		await sleep(100);
		cb(Math.min(100, Math.floor(((Date.now() - start) / ms) * 100)));
	}
}

type JobStates = "pending" | "running" | "done";

class Job<T = unknown, R extends Record<string, any> = any> extends EventEmitter<"done" | "progress" | "state", R> {
	#deffered = new DefferedPromise<T>();

	get promise() {
		return this.#deffered.promise;
	}

	done(output: T) {
		this.#deffered.resolve(output);
		this.emit("done", output);
		this.setState("done");
	}

	progress(progress: number) {
		this.emit("progress", progress);
	}

	private currentState: JobStates = "pending";

	get state() {
		return this.currentState;
	}

	setState(state: JobStates) {
		this.currentState = state;
		this.emit("state", state);
	}

	remove(arr: Job<T>[]) {
		arr.splice(arr.indexOf(this), 1);
	}

	push(arr: Job<T>[]) {
		arr.push(this);
	}
}

const downloading: Download[] = [];
const pendingDownloads: Download[] = [];

export class Download extends Job<ArrayBuffer, { progress: number; state: string }> {
	constructor(private url: string) {
		super();
		this.push(pendingDownloads);
		tick();
	}

	async start() {
		this.setState("running");
		// remove from pending
		this.remove(pendingDownloads);

		// add to downloading
		this.push(downloading);

		// simulate downloading
		await simulateProgress(randomInt(2000, 1000), this.progress.bind(this));

		// remove from downloading
		this.remove(downloading);

		// downloading is done
		this.done(new ArrayBuffer(0));

		tick();
	}
}

const decrypting: Decrypt[] = [];
const pendingDecrypt: Decrypt[] = [];

export class Decrypt extends Job<ArrayBuffer> {
	constructor(private data: ArrayBuffer) {
		super();
		this.push(pendingDecrypt);
		tick();
	}

	async start() {
		this.remove(pendingDecrypt);
		this.push(decrypting);

		this.setState("running");

		// simulate decrypting
		await simulateProgress(randomInt(2000, 1000), this.progress.bind(this));

		// decrypting is done
		this.done(new ArrayBuffer(0));

		// remove from decrypting
		this.remove(decrypting);

		tick();
	}
}

ticker.on("tick", () => {
	// if there's no longer any decrypting objects & if there's no longer any downloads happening
	if (!decrypting.length && !(downloading.length + pendingDownloads.length)) {
		// decrypt one at a time
		pendingDecrypt[0]?.start();
	}

	// if there is less than 3 downloading, start one
	if (downloading.length < 3) {
		pendingDownloads[0]?.start();
	}
});
