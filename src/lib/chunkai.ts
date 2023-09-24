export type Chunk = {
	part: number;
	startBytes: number;
	endBytes: number;
	bytes: number;
	totalBytes: number;
	data: ArrayBuffer;
};

type Options = {
	storageName: string;
	localFileUrl: string;
	remoteFileUrl: string;
	chunkByteLimit?: number;
};

export type Progress = {
	currentBytes: number;
	totalBytes: number;
};

type Request<T> = {
	error?: Error;
	result: T;
	onsuccess: () => void;
	onerror: () => void;
};

export interface DeviceStorage {
	storageName: string;
	get: (filePath: string) => Request<File>;
	addNamed: (file: File | Blob, filePath: string) => Request<File>;
	appendNamed: (file: File | Blob, filePath: string) => Request<File>;
	delete: (filePath: string) => Request<void>;
	enumerate: any;
}

type MozNavigator = Navigator & {
	getDeviceStorage: (name: string) => DeviceStorage;
	getDeviceStorageByNameAndType: (name: string, type: string) => DeviceStorage;
};

function requestPromise<T = unknown>(req: Request<T>) {
	return new Promise<T>((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export class Storage {
	private static navigator: MozNavigator = self.navigator as MozNavigator;

	static get(storage: DeviceStorage, filePath: string): Promise<File> {
		return requestPromise(storage.get(filePath));
	}
	static async getAsFileUrl(storage: DeviceStorage, filePathAndName: string): Promise<string> {
		const result = await requestPromise(storage.get(filePathAndName));
		return URL.createObjectURL(result);
	}
	static addNamed(storage: DeviceStorage, file: Blob | File, filePathAndName: string): Promise<File> {
		return requestPromise(storage.addNamed(file, filePathAndName));
	}
	static appendNamed(storage: DeviceStorage, file: Blob | File, filePathAndName: string): Promise<File> {
		return requestPromise(storage.appendNamed(file, filePathAndName));
	}
	static delete(storage: DeviceStorage, filePathAndName: string): Promise<void> {
		return requestPromise(storage.delete(filePathAndName));
	}
	static getStorageFromName(storageName: string): DeviceStorage | null {
		if (storageName === "music") return this.navigator.getDeviceStorage("music");
		return this.navigator.getDeviceStorageByNameAndType(storageName, "sdcard");
	}
}

export type HttpClientOptions = {
	chunkByteLimit: number;
};

class HttpClient {
	private $$options: HttpClientOptions;
	private $$xhr: XMLHttpRequest;

	onProgress: (progress: Chunk) => void;
	onComplete: (progress: Progress) => void;
	onError: (err: Error) => void;

	constructor(options?: HttpClientOptions) {
		this.onProgress = () => {};
		this.onComplete = () => {};
		this.onError = () => {};
		this.$$options = Object.assign({ chunkByteLimit: 3145728 }, options);
		const xhr = new (XMLHttpRequest as any)({
			mozSystem: true,
		});
		xhr.responseType = "moz-chunked-arraybuffer";
		this.$$xhr = xhr;
	}

	download(url: string): void {
		let chunk = {
			part: 1,
			startBytes: 0,
			endBytes: 0,
			bytes: 0,
			totalBytes: 0,
			data: new ArrayBuffer(0),
		};
		let savedBytes = 0;
		this.$$xhr.addEventListener("progress", (ev) => {
			const responseLength = this.$$xhr.response.byteLength;
			chunk.totalBytes = ev.total;
			let availableBytes = responseLength;
			while (availableBytes > 0) {
				const bytesNeeded = this.$$options.chunkByteLimit - chunk.data.byteLength;
				const bytesBefore = chunk.data.byteLength;
				chunk.data = this.$$appendChunk(chunk.data, this.$$xhr.response.slice(responseLength - availableBytes, responseLength - availableBytes + bytesNeeded));
				chunk.bytes = chunk.data.byteLength;
				chunk.endBytes = chunk.startBytes + chunk.data.byteLength;
				availableBytes = availableBytes - (chunk.data.byteLength - bytesBefore);
				if (chunk.data.byteLength >= this.$$options.chunkByteLimit || ev.total === ev.loaded) {
					savedBytes = savedBytes + chunk.data.byteLength;
					this.onProgress({ ...chunk });
					chunk = {
						part: chunk.part + 1,
						startBytes: chunk.endBytes,
						endBytes: chunk.endBytes,
						bytes: 0,
						totalBytes: ev.total,
						data: new ArrayBuffer(0),
					};
				}
			}
		});
		this.$$xhr.addEventListener("load", () => console.log("load", this.$$xhr.response));
		this.$$xhr.addEventListener("abort", () => console.log(`Download aborted`));
		this.$$xhr.addEventListener("error", () => this.onError?.(new Error("File download failed")));
		this.$$xhr.open("GET", url, true);
		this.$$xhr.send();
	}

	abort(): void {
		this.$$xhr.abort();
	}

	private $$appendChunk(source: ArrayBuffer, newData: ArrayBuffer) {
		if (!newData) {
			return source;
		}
		const tmp = new Uint8Array(source.byteLength + newData.byteLength);
		tmp.set(new Uint8Array(source), 0);
		tmp.set(new Uint8Array(newData), source.byteLength);
		return tmp.buffer;
	}
}

export class Chunkai {
	private $$options: Options;
	private $$httpClient?: HttpClient;
	private $$chunkQueue: Chunk[];
	private $$processingChunk: boolean;

	onProgress?: (progress: Progress) => void;
	onComplete?: (progress: Progress) => void;
	onAbort?: () => void;
	onError?: (err: Error) => void;

	private $$storage: DeviceStorage;

	constructor(options: Options) {
		this.$$chunkQueue = [];
		this.$$processingChunk = false;
		this.$$options = options;
		const storage = Storage.getStorageFromName(options.storageName);
		if (!storage) throw new Error("Storage not found");
		this.$$storage = storage;
	}

	async start(): Promise<void> {
		if (this.$$httpClient) {
			console.log("Already downloading a file");
			return;
		}
		await Storage.delete(this.$$storage, this.$$options.localFileUrl);
		await Storage.addNamed(this.$$storage, new Blob(), this.$$options.localFileUrl);

		this.$$httpClient = new HttpClient({
			chunkByteLimit: this.$$options.chunkByteLimit || 3145728,
		});
		this.$$httpClient.onProgress = (chunk) => {
			this.$$chunkQueue.push(chunk);
			this.$$processNextChunk();
		};
		this.$$httpClient.onError = (err) => this.onError?.(err);
		this.$$httpClient.download(this.$$options.remoteFileUrl);
	}

	abort() {
		if (!this.$$httpClient) return;

		this.$$httpClient.abort();
		this.onAbort?.();
	}

	private async $$processNextChunk() {
		if (this.$$processingChunk) return;

		this.$$processingChunk = true;
		const chunk = this.$$chunkQueue[0];
		if (!chunk) {
			this.$$processingChunk = false;
			return;
		}
		// console.log(
		//   `Process chunk ${chunk.part} (${chunk.endBytes}/${chunk.totalBytes}) (Queue length ${this.chunkQueue.length})`
		// );
		await Storage.appendNamed(this.$$storage, new Blob([chunk.data]), this.$$options.localFileUrl);

		this.$$chunkQueue.shift();

		this.onProgress?.({ currentBytes: chunk.endBytes, totalBytes: chunk.totalBytes });

		if (chunk.endBytes === chunk.totalBytes) {
			this.onComplete?.({ currentBytes: chunk.endBytes, totalBytes: chunk.totalBytes });
		} else {
			this.$$processingChunk = false;
			await this.$$processNextChunk();
		}
	}
}
