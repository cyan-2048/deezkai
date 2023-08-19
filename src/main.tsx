/**
 * import polyfills manually
 */
import "core-js/proposals/relative-indexing-method";
import "core-js/actual/array/flat";
import "core-js/actual/array/find-last";
import "core-js/actual/array/to-sorted";
import "core-js/actual/string/match-all";

import { render } from "preact";
import { App } from "./App";

import "./main.css";

import { decryptDownload, getAlbumTracks, getTrackDownloadUrl, getUser, initDeezerApi } from "d-fi-core";
import { arl } from "@settings";

console.log(Array.prototype.at);

render(<App />, document.getElementById("app") as HTMLElement);

(async () => {
	if (import.meta.env.DEV) {
		import("preact/debug");
		import("./dev");
	} else {
	}
})();
