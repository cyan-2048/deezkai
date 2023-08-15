import { render } from "preact";
import { App } from "./App";

import "./main.css";

/**
 * import polyfills manually
 */
import "core-js/actual/array/flat";
import "core-js/actual/array/find-last";
import "core-js/actual/array/to-sorted";
import "core-js/actual/string/match-all";
import { decryptDownload, getAlbumTracks, getTrackDownloadUrl, getUser, initDeezerApi } from "d-fi-core";
import { arl } from "@settings";

render(<App />, document.getElementById("app") as HTMLElement);

(async () => {
	if (import.meta.env.DEV) {
		import("preact/debug");
		import("./dev");
	} else {
		import("./dev");
		console.log(await initDeezerApi(arl.peek()));

		console.log(await getUser());

		const tracks = await getAlbumTracks("221543452");

		for (let track of tracks.data) {
			const trackData = await getTrackDownloadUrl(track, 1);
			if (trackData) {
				console.log("isEnc", trackData.isEncrypted);
				// Download track

				// @ts-ignore
				const xhr = new XMLHttpRequest({ mozSystem: true });

				xhr.open("GET", trackData.trackUrl);
				xhr.responseType = "arraybuffer";

				xhr.onprogress = (event) => {
					if (event.lengthComputable) {
						const percentage = Math.round((event.loaded * 100) / event.total);
						console.log("Downloading:", percentage);
					}
				};

				xhr.send();

				await new Promise((res) => {
					xhr.addEventListener("load", async () => {
						const result = xhr.response;
						console.log(result);
						console.log("Downloading from Deezer was a success!!!");

						console.log("Decrypting");
						// Decrypt track if needed
						const outFile = trackData.isEncrypted
							? await decryptDownload(result, track.SNG_ID, (n) => {
									console.log("Decrypting", n);
							  })
							: result;
						console.log("Decrypting done", outFile);

						res(0);

						const audio = new Audio();
						const blob = new Blob([outFile]);
						const url = URL.createObjectURL(blob);
						audio.src = url;
						audio.play();
					});
				});

				// Save file to disk
				// fs.writeFileSync(track.SNG_TITLE + ".mp3", outFile);
			}
		}
	}
})();
