// this is the jobs thing, this will handle the "jobs"

import EventEmitter from "./EventEmitter";

class Ticker extends EventEmitter {
	tick() {
		this.emit("tick");
	}
}

const ticker = new Ticker();

const downloading = [];

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

type JobStates = "pending" | "running" | "done";

class Job<T = unknown> extends EventEmitter<"done" | "progress" | "state"> {
	#deffered = new DefferedPromise<T>();

	get promise() {
		return this.#deffered.promise;
	}

	done(output: T) {
		this.#deffered.resolve(output);
		this.emit("done", output);
	}

	progress(progress: number) {
		this.emit("progress", progress);
	}

	currentState: JobStates = "pending";

	get state() {
		return this.currentState;
	}

	setState(state: JobStates) {
		this.emit("state", state);
	}
}

export class DownloadJob extends Job<ArrayBuffer> {
	constructor(url: string) {
		super();

		this.setState("pending");
	}
}
