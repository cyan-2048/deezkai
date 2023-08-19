import { getTrackDownloadUrl, getTrackInfo, initDeezerApi } from "d-fi-core";
import { Chunkai } from "./chunkai";
import { trackType } from "d-fi-core/src/types";

function progress(n: number, trackID: string, id: string) {
	postMessage({ progress: n, trackID, id });
}

interface Message {
	trackID: string;
	filename: string;
	id: string;
	storageName: string;
	quality: 1 | 3;
}

export interface DownloadOutput {
	complete: true;
	id: string;
	track: trackType;
	trackData: { trackUrl: string; isEncrypted: boolean; fileSize: number };
}

function downloadFileAsDesktop(info: Message) {}

// downloading implementation for KaiOS
async function downloadFileKaiOS(info: Message) {
	const track = await getTrackInfo(info.trackID);
	const trackData = await getTrackDownloadUrl(track, 1);

	// haven't planned this yet
	if (!trackData) return;

	const chunkai = new Chunkai({
		chunkByteLimit: 1048576,
		storageName: info.storageName,
		remoteFileUrl: trackData.trackUrl,
		localFileUrl: info.filename,
	});

	let _progress = 0;

	chunkai.onProgress = ({ currentBytes, totalBytes }) => {
		const currentProgress = Math.floor((currentBytes / totalBytes) * 100);
		if (currentProgress > _progress) {
			progress(_progress, info.trackID, info.id);
			_progress = currentProgress;
		}
	};
	chunkai.onComplete = () => {
		progress(100, info.trackID, info.id);
		postMessage({ complete: true, id: info.id, track, trackData });
	};
	chunkai.onError = (err) => console.log("error", err);

	chunkai.start();
}

interface InitARL {
	arl: string;
}

addEventListener("message", async ({ data }: MessageEvent<Message | InitARL>) => {
	if ("arl" in data) {
		await initDeezerApi(data.arl);
		console.log("init happened");
		postMessage({ arl: true });
	} else {
		if (import.meta.env.DEV) {
			downloadFileAsDesktop(data);
		} else {
			downloadFileKaiOS(data);
		}
	}
});
