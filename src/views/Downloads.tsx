import { back, useInViewEffect } from "./ViewHandler";
import { register } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";
import { signal } from "@preact/signals";
import { v4 as uuidv4 } from "uuid";
import { Decrypt, Download } from "src/lib/jobs";
import { sleep } from "@utils";

const queue = signal<QueueItem[]>([]);

function remove(item: QueueItem) {
	const _queue = queue.peek();
	_queue.splice(_queue.indexOf(item), 1);
	queue.value = _queue.slice(0);
}

class QueueItem {
	progress = signal(0);
	state = signal("pending");
	id = uuidv4();

	constructor(public trackID: string) {
		queue.value = [...queue.peek(), this];
		this.start();
	}

	async start() {
		const download = new Download(this.trackID);
		download.on("progress", ({ detail }) => {
			this.progress.value = detail;
		});
		this.state.value = "Downloading";

		const downloadOutput = await download.promise;
		if (downloadOutput.trackData.isEncrypted) {
			this.state.value = "Decrypting";
			this.progress.value = 0;

			const decrypt = new Decrypt(downloadOutput.buffer, this.trackID);
			decrypt.on("progress", ({ detail }) => {
				this.progress.value = detail;
			});

			const decryptOutput = await decrypt.promise;
			await download.deleteFile();

			this.state.value = "Done";

			// test code
			const audio = new Audio();
			const blob = new Blob([decryptOutput]);
			const url = URL.createObjectURL(blob);
			audio.src = url;
			audio.play();
		}
		await sleep(1000);
		remove(this);
	}
}

function start(trackID: string) {
	new QueueItem(trackID);
}

function DownloadItem({ item }: { item: QueueItem }) {
	return (
		<div>
			<div>{item.state.value}</div>
			<div>progress: {item.progress.value}</div>
		</div>
	);
}

export default function Settings() {
	useInViewEffect(() => {
		console.log("inview");
		setSoftkeys("Options", "Select", "Back");

		if (queue.peek().length == 0) {
			start("781592622");
		}

		register(["Backspace", "SoftRight"], back, { once: true, preventDefault: true });

		return () => {
			console.log("no longer in view");
		};
	});

	return (
		<main>
			<h1>Downloads</h1>
			{queue.value.map((item) => (
				<DownloadItem key={item.id} item={item} />
			))}
		</main>
	);
}
