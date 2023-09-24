import { back, useInViewEffect, useInViewSignal } from "./ViewHandler";
import { Navigation, centerScroll, register, unregister } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";
import { computed, signal } from "@preact/signals";
import { v4 as uuidv4 } from "uuid";
import { Decrypt, Download, Job } from "src/lib/jobs";
import { albumCoverURL, clx, sleep } from "@utils";
import Header from "./components/Header";

import styles from "./Downloads.module.scss";
import { MutableRef, useEffect, useLayoutEffect, useRef } from "preact/hooks";
import { FunctionalComponent } from "preact";
import Marquee from "./components/Marquee";
import EventEmitter from "src/lib/EventEmitter";

const queue = signal<QueueItem[]>([]);
const queue_empty = computed(() => queue.value.length == 0);

function remove(item: QueueItem) {
	const _queue = queue.peek();
	_queue.splice(_queue.indexOf(item), 1);
	queue.value = _queue.slice(0);
}

const events = new EventEmitter();

// test code
const audio = new Audio();

class QueueItem {
	progress = signal(0);
	state = signal("pending");
	id = uuidv4();
	title = signal("Loading...");
	imageSrc = signal("");
	error?: Error;

	constructor(public trackID: string) {
		queue.value = [...queue.peek(), this];
		this.start().catch((error) => {
			this.error = error;
			this.state.value = "error";
			console.error(error);
		});
	}

	private $$currentWork: Job | null = null;

	async start() {
		if (this.$$aborted) return;

		const download = new Download(this.trackID);
		this.$$currentWork = download;
		download.on("progress", ({ detail }) => {
			this.progress.value = detail;
		});
		this.state.value = "Downloading";

		download.once("info", ({ detail: { track } }) => {
			this.title.value = track.ART_NAME + " - " + track.SNG_TITLE;
			this.imageSrc.value = albumCoverURL(track.ALB_PICTURE, 56);
		});

		const downloadOutput = await download.promise;
		let buffer: ArrayBuffer = downloadOutput.buffer;

		if (downloadOutput.trackData.isEncrypted) {
			this.state.value = "Decrypting";
			this.progress.value = 0;

			const decrypt = new Decrypt(buffer, this.trackID);
			this.$$currentWork = decrypt;
			decrypt.on("progress", ({ detail }) => {
				this.progress.value = detail;
			});

			this.$$abort = () => {
				download.deleteFile();
			};

			const decryptOutput = await decrypt.promise;
			await download.deleteFile();

			buffer = decryptOutput;
		}

		this.$$currentWork = null;
		this.state.value = "Done";
		await sleep(100);
		remove(this);
	}

	private $$abort = () => {};
	private $$aborted = false;

	async abort() {
		if (this.$$aborted) return;
		this.$$aborted = true;
		this.$$abort();
		this.$$currentWork?.abort();
		this.state.value = "Aborted";
		await sleep(100);
		remove(this);
	}
}

function start(trackID: string) {
	new QueueItem(trackID);
}

const nav = new Navigation(queue);

const focusedItemPosition = signal(25);

function MarqueeOrNotItem({ children: item }: { children: QueueItem }) {
	const focused = nav.index.value == queue.value.indexOf(item);
	return focused ? <Marquee>{item.title.value}</Marquee> : <>{item.title.value}</>;
}

function DownloadItem({ item }: { item: QueueItem }) {
	const downloadItemEl = useRef() as MutableRef<HTMLDivElement>;

	const inView = useInViewSignal();

	// const [focused, setFocused] = useState(false);

	useLayoutEffect(() => {
		let cancelled = false;

		async function repaint(index: number, noScroll = false) {
			if (cancelled) return;
			cancelled = true;
			setTimeout(() => (cancelled = false), 200);
			const queue_peek = queue.peek();
			const currentIndex = queue_peek.indexOf(item);
			if (index == currentIndex && downloadItemEl?.current) {
				//setFocused(true);
				!noScroll && (await centerScroll(downloadItemEl.current, !inView.peek()));

				const currentItemPosition = focusedItemPosition.peek();
				const newItemPosition = downloadItemEl.current.getBoundingClientRect().top;
				const distance = Math.abs(currentItemPosition - newItemPosition);

				//console.log(distance);

				if (index > 3 && index < queue_peek.length - 5 && distance < 50) {
					//	console.log(index, "skip set position", newItemPosition, "distance", distance);
					return;
				}
				// console.log(index, "set position", newItemPosition, "distance", distance);
				focusedItemPosition.value = newItemPosition;
			} // else setFocused(false);
		}

		function repaintCallback() {
			repaint(nav.index.peek(), true);
		}

		const navSub = nav.index.subscribe(repaint);
		events.on("repaint", repaintCallback);

		return () => {
			navSub();
			events.off("repaint", repaintCallback);
		};
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
	const bodyEl = useRef() as MutableRef<HTMLDivElement>;

	if (import.meta.env.DEV)
		useEffect(() => {
			const repaint = () => events.emit("repaint");
			bodyEl.current?.addEventListener("scroll", repaint);
			return () => bodyEl.current?.removeEventListener("scroll", repaint);
		}, []);

	return (
		<div ref={bodyEl} class={styles.body}>
			{props.children}
		</div>
	);
};

function FocusedItem() {
	return <div style={{ top: focusedItemPosition.value, opacity: queue_empty.value ? 0 : undefined }} class={clx("view_animation", styles.focus_item)}></div>;
}

export default function Downloads() {
	useInViewEffect(() => {
		console.log("inview Downloads");
		const c = nav.getLength() ? "Abort" : "";
		console.log(c);
		setSoftkeys("Options", c, "Back");

		if (queue.peek().length == 0) {
			// start("781592622");
			//start("1053797822");

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
		}

		const backspace = register(["Backspace", "SoftRight"], back, { once: true, preventDefault: true });
		const unregister_Enter = register(["Enter", "ArrowRight"], (e) => {
			const currentQueueItem = queue.peek()[nav.index.peek()];
			console.log("item: ", currentQueueItem);

			if (e.key == "Enter") currentQueueItem?.abort();
		});

		const isEmpty = queue_empty.subscribe((empty) => {
			setSoftkeys("Options", empty ? "" : "Abort", "Back");
		});

		const unregister_nav = nav.register();

		return () => {
			unregister_nav();
			unregister(unregister_Enter, backspace, isEmpty);
			console.log("no longer inview Downloads");
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
