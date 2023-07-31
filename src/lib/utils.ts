type coverSize = 56 | 250 | 500 | 1000 | 1500 | 1800 | number;

const albumCoverCache = new Map<string, ArrayBuffer>();

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
		const url = `https://e-cdns-images.dzcdn.net/images/cover/${albumPicture}/${albumCoverSize}x${albumCoverSize}-000000-80-0-0.jpg`;
		// should work because deezer allows it
		const resp = await fetch(url);
		const buffer = await resp.arrayBuffer();
		albumCoverCache.set(slug, buffer);
		return buffer;
	} catch (err) {
		return null;
	}
};
