import { Signal, signal } from "@preact/signals";

function $$<T = any>(name: string, defaultValue: T) {
	const localStorageValue = localStorage.getItem(name);

	const set = (val: any) => localStorage.setItem(name, val);

	let $: Signal;

	if (typeof defaultValue == "boolean") {
		$ = signal(localStorageValue ? localStorageValue == "1" : defaultValue);
		$.subscribe((val) => set(String(+val)));
	} else if (typeof defaultValue == "string") {
		$ = signal(localStorageValue ?? defaultValue);
		$.subscribe((val) => set(val));
	} else {
		$ = signal(localStorageValue ? JSON.parse(localStorageValue) : defaultValue);
		$.subscribe((val) => set(JSON.stringify(val)));
	}

	return $ as Signal<T>;
}

let count = 0;
function id() {
	count++;
	return "deez-" + count;
}

function $<T = any>(val: T) {
	return $$(id(), val);
}

export const enum ArtistSeparator {
	Comma,
	SemiColon,
	Slash,
	Ampersand,
	Null,
}

function getDefaultStorage(): string {
	if (import.meta.env.DEV) {
		return "devmode";
	} else {
		// @ts-ignore
		return navigator.getDeviceStorage("sdcard").storageName;
	}
}

export const arl = $$(
	"arl",
	"e3f058fb4295c9cfffe0d3017ad438ecec72417a41348286c643bea7b0a71fe2ddeb2cb9fbfb493c6cbf532123447f4f87294806622a79a074a762e49e70f77d834084024a345240a1529080174db8e9ca95903b183c78e19f160ac2f7ceb832"
);
export const musicQuality = $<1 | 3>(1);
export const addMetadata = $(true);
export const albumFolders = $(true);
export const artistSeparator = $<ArtistSeparator>(ArtistSeparator.Comma);
export const artistSeparatorSpace = $(true);
export const albumTrackName = $("number - title");
export const trackName = $("artist - title");
export const folderPath = $("DeezKai/");
export const storageName = $(getDefaultStorage());

interface TrackNameMetadata
	extends Partial<{
		title: string;
		album: string;
		artist: string;
		number: number | string;
		contributors: string;
		date: string;
		genre: string;
		trackid: string | number;
	}> {}

export const metadataKeys = Object.freeze(["title", "album", "artist", "number", "contributors", "date", "genre", "trackid"]);

const metadataKeysRegex = /title|album|artist|number|contributors|date|genre|trackid/g;

function generateName(name: Signal<string>, metadata: TrackNameMetadata) {
	return name.peek().replace(metadataKeysRegex, (key) => String(metadata[key as keyof TrackNameMetadata] ?? ""));
}

export const generateAlbumTrackName = generateName.bind(null, albumTrackName);
export const generateTrackName = generateName.bind(null, trackName);
