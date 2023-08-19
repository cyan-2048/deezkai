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
		this.cancelProgressEvent?.();
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

	private cancelProgressEvent: null | (() => void) = null;

	handleProgressEvent(worker: Worker, verify?: (e: any) => boolean) {
		if (this.cancelProgressEvent) {
			this.cancelProgressEvent();
		}

		const e = ({ data }: MessageEvent) => {
			if ((!verify || verify(data)) && "progress" in data) {
				this.progress(data.progress);
			}
		};

		worker.addEventListener("message", e);
		this.cancelProgressEvent = () => worker.removeEventListener("message", e);
	}
}

const downloading: Download[] = [];
const pendingDownloads: Download[] = [];

const downloadWorker = new Worker(new URL("./download.ts", import.meta.url), {
	type: "module",
});

let downloadWorkerReady = Promise.resolve();
arl.subscribe(async (val) => {
	const deffered = new DefferedPromise<void>();

	downloadWorkerReady = deffered.promise;

	const success = waitForWorker(downloadWorker, ({ data }) => data?.arl);
	downloadWorker.postMessage({ arl: val });

	await success;
	deffered.resolve();
});

downloadWorker.onmessage = (e) => console.log(e);

import { v4 as uuidv4 } from "uuid";
import { arl, folderPath, storageName } from "@settings";
import { DownloadOutput } from "./download";
import { DeviceStorage, Storage } from "./chunkai";

interface DownloadJobOutput extends DownloadOutput {
	buffer: ArrayBuffer;
}

function readFile(file: Blob | File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		var fr = new FileReader();
		fr.onload = () => {
			resolve(fr.result as ArrayBuffer);
		};
		fr.onerror = reject;
		fr.readAsArrayBuffer(file);
	});
}

export class Download extends Job<DownloadJobOutput, { progress: number; state: string }> {
	storage?: DeviceStorage;
	id?: string;
	filename?: string;

	constructor(private trackID: string) {
		super();
		this.push(pendingDownloads);
		tick();
	}

	async deleteFile() {
		if (this.filename && this.storage) {
			await Storage.delete(this.storage, this.filename);
		}
	}

	async start() {
		this.setState("running");
		// remove from pending
		this.remove(pendingDownloads);

		// add to downloading
		this.push(downloading);

		const filename = (this.filename = `${folderPath.peek()}temp/${(this.id = uuidv4())}.bin`);

		await downloadWorkerReady;

		// handle progress events
		this.handleProgressEvent(downloadWorker, (data) => data && data.progress && data.id == this.id);

		const waiting = waitForWorker<DownloadOutput>(downloadWorker, ({ data }) => data && data.complete && data.id == this.id);
		downloadWorker.postMessage({ trackID: this.trackID, filename, id: this.id, storageName: storageName.peek() });

		const { data } = await waiting;

		const storage = (this.storage = Storage.getStorageFromName(storageName.peek())!);
		const outputFile = await Storage.get(storage, filename);

		// remove from downloading
		this.remove(downloading);

		// downloading is done
		this.done({ ...data, buffer: await readFile(outputFile) });

		tick();
	}
}

const decrypting: Decrypt[] = [];
const pendingDecrypt: Decrypt[] = [];

const decryptWorker = new Worker(new URL("./decrypt.ts", import.meta.url), {
	type: "module",
});

decryptWorker.onmessage = (e) => console.log(e);

async function waitForWorker<T = any>(worker: Worker, verify?: (e: MessageEvent) => boolean): Promise<MessageEvent<T>> {
	return new Promise((res) => {
		worker.addEventListener("message", (e) => {
			if (!verify || verify(e)) {
				res(e);
			}
		});
	});
}

export class Decrypt extends Job<ArrayBuffer> {
	constructor(private buffer: ArrayBuffer, private trackID: string) {
		super();
		this.push(pendingDecrypt);
		tick();
	}

	async start() {
		this.remove(pendingDecrypt);
		this.push(decrypting);

		this.setState("running");

		// send buffer to worker
		decryptWorker.postMessage({ trackID: this.trackID, buffer: this.buffer }, [this.buffer]);

		// handle progress events
		this.handleProgressEvent(decryptWorker, (data) => data.trackID == this.trackID);

		const { data } = await waitForWorker(decryptWorker, ({ data }) => data?.done == this.trackID);

		// decrypting is done
		this.done(data.buffer);

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
