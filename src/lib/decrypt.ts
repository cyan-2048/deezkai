import { decryptDownload } from "d-fi-core";

console.info("decrypt worker init");

addEventListener("message", async (e: MessageEvent) => {
	const {
		data: { trackID, buffer: data },
	} = e;

	const { buffer } = await decryptDownload(data, trackID, (n) => {
		postMessage({ trackID, progress: n });
	});

	// @ts-ignore
	postMessage({ done: trackID, buffer }, [buffer]);
});
