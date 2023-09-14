type coverSize = 56 | 250 | 500 | 1000 | 1500 | 1800 | number;

const albumCoverCache = new Map<string, ArrayBuffer>();

/**
 *
 * @param  albumPicture ALB_PICTURE
 * @param  albumCoverSize in pixel, between 56-1800
 */
export function albumCoverURL(albumPicture: string, albumCoverSize: coverSize): string {
	return `https://e-cdns-images.dzcdn.net/images/cover/${albumPicture}/${albumCoverSize}x${albumCoverSize}-000000-80-0-0.jpg`;
}

/**
 *
 * @param  albumPicture ALB_PICTURE
 * @param  albumCoverSize in pixel, between 56-1800
 */
export const downloadAlbumCover = async (albumPicture: string, albumCoverSize: coverSize): Promise<ArrayBuffer | null> => {
	const slug = `${albumPicture}-${albumCoverSize}`;
	const fromCache = albumCoverCache.get(slug);
	if (fromCache) return fromCache;

	try {
		const url = albumCoverURL(albumPicture, albumCoverSize);
		// should work because deezer allows it
		const resp = await fetch(url);
		const buffer = await resp.arrayBuffer();
		albumCoverCache.set(slug, buffer);
		return buffer;
	} catch (err) {
		return null;
	}
};

/**
 * brings back focus to the app
 */
export async function focusApp(): Promise<void> {
	if (import.meta.env.DEV) {
		try {
			(window as any).unsafeFocus();
		} catch (e) {
			alert("focus");
		}
	} else if ("mozApps" in navigator) {
		// @ts-ignore
		return navigator.mozApps.getSelf().then((e) => void e.launch());
	}
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function randomInt(max: number, min = 0) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function clx(obj: Record<string, any>): string;
export function clx(...arr: any[]): string;
export function clx(): string {
	if (arguments.length === 1) {
		return Object.entries(arguments[0])
			.map(([key, value]) => {
				if (Boolean(value)) return key;
			})
			.join(" ");
	} else {
		return Array.from(arguments).filter(Boolean).join(" ");
	}
}

export const frozenPromise: Promise<never> = new Promise(() => {});
