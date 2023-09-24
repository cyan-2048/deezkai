import { decryptDownload } from "d-fi-core";

console.info("decrypt worker init");

const abortList = new Set<string>();

addEventListener("message", async (e: MessageEvent) => {
	if (e.data.abort) {
		abortList.add(e.data.abort);
		return;
	}

	const {
		data: { trackID, buffer: data },
	} = e;

	const { buffer } = await decryptDownload(
		data,
		trackID,
		(n) => {
			postMessage({ trackID, progress: n });
		},
		false,
		() => abortList.has(trackID)
	);

	// @ts-ignore
	postMessage({ done: trackID, buffer }, [buffer]);
});
