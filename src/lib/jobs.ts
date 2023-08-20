// this is the jobs thing, this will handle the "jobs"

import { sleep } from "@utils";
import EventEmitter from "./EventEmitter";
import { v4 as uuidv4 } from "uuid";
import { arl, folderPath, musicQuality, storageName } from "@settings";

import { Chunkai, DeviceStorage, Storage } from "./chunkai";
import { getTrackDownloadUrl, getTrackInfo, initDeezerApi } from "d-fi-core";
import { trackType } from "d-fi-core/src/types";

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

arl.subscribe(async (val) => {
	initDeezerApi(val);
});

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

interface TrackInfoResult {
	trackID: string;
	track: trackType;
	trackData?: { trackUrl: string; isEncrypted: boolean; fileSize: number };
}

interface DownloadResult extends TrackInfoResult {
	buffer: ArrayBuffer;
}
export class Download extends Job<DownloadResult, { progress: number; state: string }> {
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

		const track = await getTrackInfo(this.trackID);
		const trackData = await getTrackDownloadUrl(track, musicQuality.peek());

		if (!trackData) throw new Error("trackData is missing");

		const chunkai = new Chunkai({
			chunkByteLimit: 1048576,
			storageName: storageName.peek(),
			remoteFileUrl: trackData.trackUrl,
			localFileUrl: filename,
		});

		let _progress = 0;

		chunkai.onProgress = ({ currentBytes, totalBytes }) => {
			const currentProgress = Math.floor((currentBytes / totalBytes) * 100);
			if (currentProgress > _progress) {
				this.progress(_progress);
				_progress = currentProgress;
			}
		};
		chunkai.onComplete = async () => {
			this.progress(100);

			const storage = (this.storage = Storage.getStorageFromName(storageName.peek())!);
			const outputFile = await Storage.get(storage, filename);

			// remove from downloading
			this.remove(downloading);

			// downloading is done
			this.done({ trackData, track, trackID: this.trackID, buffer: await readFile(outputFile) });
			this.deleteFile();

			tick();
		};
		chunkai.onError = (err) => console.log("error", err);
		chunkai.start();
	}
}

const decrypting: Decrypt[] = [];
const pendingDecrypt: Decrypt[] = [];

const decryptWorker = new Worker(new URL("./decrypt.ts", import.meta.url), {
	type: "module",
});

async function waitForWorker<T = any>(worker: Worker, verify?: (e: MessageEvent) => boolean): Promise<MessageEvent<T>> {
	return new Promise((res) => {
		worker.addEventListener("message", function a(e) {
			if (!verify || verify(e)) {
				res(e);
				worker.removeEventListener("message", a);
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

		// handle progress events
		this.handleProgressEvent(decryptWorker, (data) => data.trackID == this.trackID);

		const wait = waitForWorker(decryptWorker, ({ data }) => data?.done == this.trackID);
		// send buffer to worker
		decryptWorker.postMessage({ trackID: this.trackID, buffer: this.buffer }, [this.buffer]);

		// decrypting is done
		this.done((await wait).data.buffer);

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
