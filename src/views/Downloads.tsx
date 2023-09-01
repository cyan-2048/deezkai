import { back, useInView, useInViewEffect, useInViewSignal } from "./ViewHandler";
import { Navigation, centerScroll, register } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";
import { computed, signal } from "@preact/signals";
import { v4 as uuidv4 } from "uuid";
import { Decrypt, Download } from "src/lib/jobs";
import { albumCoverURL, clx, randomInt, sleep } from "@utils";
import Header from "./components/Header";

import styles from "./Downloads.module.scss";
import { MutableRef, useLayoutEffect, useRef, useState } from "preact/hooks";
import { FunctionalComponent, Ref } from "preact";
import Marquee from "./components/Marquee";

const queue = signal<QueueItem[]>([]);

const queue_empty = computed(() => queue.value.length == 0);

function remove(item: QueueItem) {
	const _queue = queue.peek();
	_queue.splice(_queue.indexOf(item), 1);
	queue.value = _queue.slice(0);
}

// test code
const audio = new Audio();

class QueueItem {
	progress = signal(0);
	state = signal("pending");
	id = uuidv4();
	title = signal("Loading...");
	imageSrc = signal("");

	constructor(public trackID: string) {
		queue.value = [...queue.peek(), this];
		if (import.meta.env.PROD) this.start();
	}

	async start() {
		const download = new Download(this.trackID);
		download.on("progress", ({ detail }) => {
			this.progress.value = detail;
		});
		this.state.value = "Downloading";

		download.once("info", ({ detail: { track } }) => {
			this.title.value = track.ART_NAME + " - " + track.SNG_TITLE;
			this.imageSrc.value = albumCoverURL(track.ALB_PICTURE, 56);
		});

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

			const blob = new Blob([decryptOutput]);
			const url = URL.createObjectURL(blob);
			URL.revokeObjectURL(audio.src);
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

const nav = new Navigation(queue);

const focusedItemPosition = signal(25);

function MarqueeOrNotItem({ children: item }: { children: QueueItem }) {
	const focused = nav.index.value == queue.peek().indexOf(item);
	return focused ? <Marquee>{item.title.value}</Marquee> : <>{item.title.value}</>;
}

function DownloadItem({ item }: { item: QueueItem }) {
	const downloadItemEl = useRef() as MutableRef<HTMLDivElement>;

	const inView = useInViewSignal();

	useLayoutEffect(() => {
		return nav.index.subscribe(async (index) => {
			if (index == queue.peek().indexOf(item) && downloadItemEl?.current) {
				await centerScroll(downloadItemEl.current, !inView.peek());
				focusedItemPosition.value = downloadItemEl.current.getBoundingClientRect().top;
			}
		});
	}, []);

	return (
		<div ref={downloadItemEl} class={styles.download_item}>
			<div class={styles.item_icon}>
				{item.imageSrc.value ? (
					<img src={item.imageSrc.value} alt="" />
				) : (
					<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-music-note-beamed" viewBox="0 0 16 16">
						<path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z" />
						<path fill-rule="evenodd" d="M14 11V2h1v9h-1zM6 3v10H5V3h1z" />
						<path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z" />
					</svg>
				)}
			</div>
			<div class={styles.item_wrap}>
				<div class={styles.item_title}>
					<MarqueeOrNotItem>{item}</MarqueeOrNotItem>
				</div>
				<div>{item.state.value}</div>
				<div class={styles.progress}>
					<div class={styles.bar} style={{ width: item.progress.value + "%" }}></div>
				</div>
			</div>
		</div>
	);
}

const Body: FunctionalComponent = (props) => {
	return <div class={styles.body}>{props.children}</div>;
};

function FocusedItem() {
	return <div style={{ top: focusedItemPosition.value, opacity: queue_empty.value ? 0 : undefined }} class={clx("view_animation", styles.focus_item)}></div>;
}

export default function Settings() {
	useInViewEffect(() => {
		console.log("inview");
		setSoftkeys("Options", "Select", "Back");

		if (queue.peek().length == 0) {
			start("781592622");
			//start("1053797822");
			/*
			start("2355587695");
			start("2355587705");
			start("2355587715");

			start("2355587725");
			start("2355587735");
			start("2355587745");
			start("2355587755");
			start("2355587765");
			start("2355587775");
			start("2355587785");
			start("2355587795");
			start("2355587805");
			start("2355587815");
			start("2355587825");
			start("2355587835");
			start("2355587845");
			start("2355587855");
			start("2355587865");
			start("2355587875");
			start("2355587885");
			start("2355587895");
			start("2355587905");
			*/
		}

		register(["Backspace", "SoftRight"], back, { once: true, preventDefault: true });

		const unregister_nav = nav.register();

		return () => {
			unregister_nav();
			console.log("no longer in view");
		};
	});

	return (
		<main>
			<Header>Downloads</Header>
			<Body>
				<FocusedItem />
				{queue.value.map((item) => (
					<DownloadItem key={item.id} item={item} />
				))}
			</Body>
		</main>
	);
}
