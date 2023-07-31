import { render } from "preact";
import { App } from "./App";

/**
 * import polyfills manually
 */
import "core-js/actual/array/flat";
import "core-js/actual/array/find-last";
import "core-js/actual/array/to-sorted";
import "core-js/actual/string/match-all";
import { getAlbumTracks, getUser, initDeezerApi } from "d-fi-core";
import { arl } from "@settings";

render(<App />, document.getElementById("app") as HTMLElement);

(async () => {
	if (import.meta.env.DEV) {
		import("preact/debug");
		import("./dev");
	} else {
		console.log(
			await initDeezerApi(
				"e3f058fb4295c9cfffe0d3017ad438ecec72417a41348286c643bea7b0a71fe2ddeb2cb9fbfb493c6cbf532123447f4f87294806622a79a074a762e49e70f77d834084024a345240a1529089174db8e9ca95903b183c78e19f160ac2f7ceb832"
			)
		);

		console.log(await getUser());

		console.log(await getAlbumTracks("221543452"));
	}
})();
