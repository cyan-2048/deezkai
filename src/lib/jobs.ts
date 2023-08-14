// this is the jobs thing, this will handle the "jobs"

import { sleep } from "@utils";
import EventEmitter from "./EventEmitter";

class Ticker extends EventEmitter {
	tick() {
		this.emit("tick");
	}
}

const ticker = new Ticker();

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

export class Download extends Job<ArrayBuffer> {
	constructor(private url: string) {
		super();
		this.push(pendingDownloads);
		ticker.tick();
	}

	async start() {
		this.setState("running");
		// remove from pending
		this.remove(pendingDownloads);

		// add to downloading
		this.push(downloading);

		// simulate downloading
		await sleep(3000);

		// remove from downloading
		this.remove(downloading);

		// downloading is done
		this.done(new ArrayBuffer(0));

		ticker.tick();
	}
}

ticker.on("tick", () => {});
