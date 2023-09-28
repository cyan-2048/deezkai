import { register, unregister } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";
import { back, useInViewEffect, useInViewSignal } from "./ViewHandler";
import styles from "./Player.module.scss";
import Marquee from "./components/Marquee";
import { Fragment, h } from "preact";
import { signal } from "@preact/signals";

let audio = new Audio();

function MarqueeOrNot(props: Parameters<typeof Marquee>[0]) {
	const inView = useInViewSignal();
	return h((inView.value ? Marquee : Fragment) as any, props);
}

export interface Song {
	info: {
		title: string;
		artist: string;
		album: string;
		albumArt: string;
	};
	blob: Blob;
}

let previous: Song[] = [];
let upcoming: Song[] = [];

const currentTime = signal(0);
const paused = signal(false);

function createNewAudio() {
	audio.pause();
	audio.remove();
	const _audio = new Audio();

	_audio.pause();
	_audio.addEventListener("timeupdate", () => {
		currentTime.value = _audio.currentTime;
	});
	_audio.addEventListener("ended", () => {
		playNextSong();
	});
	_audio.addEventListener("pause", () => {
		paused.value = true;
	});
	_audio.addEventListener("play", () => {
		paused.value = false;
	});
	document.body.appendChild(_audio);
	audio.mozAudioChannelType = "content";

	audio = _audio;
}

const currentSong = signal<Song | null>(null);

export function playNextSong() {
	createNewAudio();

	const nextSong = upcoming.shift();

	if (nextSong) {
		previous.push(nextSong);
		currentSong.value = nextSong;
		audio.src = URL.createObjectURL(nextSong.blob);
		audio.play();
	}
}

export function playSong(song: Song) {
	upcoming.unshift(song);
	playNextSong();
}

export function addSongToQueue(song: Song) {
	upcoming.push(song);
}

function Progress() {
	return <div style={{ width: Math.floor((currentTime.value / audio.duration) * 100) + "%" }} class={styles.bar}></div>;
}

function Title() {
	const current = currentSong.value?.info;
	return current ? (
		<MarqueeOrNot>
			{current.artist} - {current.title} - {current.album}
		</MarqueeOrNot>
	) : (
		("Loading..." as any)
	);
}

function Cover() {
	const current = currentSong.value?.info;
	return <div class={styles.cover} style={{ "--cover": current ? `url(${current.albumArt})` : null }}></div>;
}

function sToTime(t: number) {
	return padZero((t / 60) % 60) + ":" + padZero(t % 60);
}
function padZero(y: number) {
	const v = Math.floor(y);
	return v < 10 ? "0" + v : v;
}

function Time() {
	return <div class={styles.time}>{sToTime(currentTime.value)}</div>;
}

function Paused() {
	return <>{paused.value ? "Play" : "Pause"}</>;
}

export default function Player() {
	useInViewEffect(() => {
		setSoftkeys("Options", <Paused />, "Back");

		register(
			"Backspace",
			() => {
				back();
			},
			{ once: true, preventDefault: true }
		);

		const _a = register("Enter", () => {
			audio.paused ? audio.play() : audio.pause();
		});

		return () => {
			unregister(_a);
		};
	});
	return (
		<main class={styles.view}>
			<Cover />
			<div class={styles.bottom}>
				<div class={styles.text}>
					<Title />
				</div>
				<Time />
			</div>
			<div class={styles.progress}>
				<Progress />
			</div>
		</main>
	);
}
