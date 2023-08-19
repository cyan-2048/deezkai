import { HttpClient } from "./chunkai";

interface HttpClientMessage {
	chunkByteLimit: number;
	id: string;
	url: string;
}

addEventListener("message", async ({ data }: MessageEvent<HttpClientMessage>) => {
	const httpclient = new HttpClient({ chunkByteLimit: data.chunkByteLimit });
	httpclient.onProgress = (progress) => {
		// @ts-ignore
		postMessage({ chunk: progress, id: data.id }, [progress.data]);
	};
	postMessage({ id: data.id, progress: 0 });

	httpclient.download(data.url);
});
