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
		function async<A>(generator: GeneratorFunction, __arguments = [], __this: A) {
			let _generator: Generator;
			return new Promise((resolve, reject) => {
				var step = (x: IteratorResult<any, any>) =>
					x.done
						? resolve(x.value)
						: Promise.resolve(x.value).then(
								(value) => {
									try {
										step(_generator.next(value));
									} catch (e) {
										reject(e);
									}
								},
								(value) => {
									try {
										step(_generator.throw(value));
									} catch (e) {
										reject(e);
									}
								}
						  );
				step((_generator = generator.apply(__this, __arguments)).next());
			});
		}

		Object.assign(window, { async });

		/*
		// TEST for getRoot()
		const e: DeviceStorage = navigator.getDeviceStorage("sdcard");

		const root: Directory = await e.getRoot();

		async function recursive(entries: Array<Directory | File>, directory: Directory) {
			console.log("Folder:", directory.path);
			let directories: Directory[] = [];
			for (let entry of entries) {
				if (entry instanceof File) {
					console.log("File:", directory.path + "/" + entry.name);
				} else {
					directories.push(entry);
				}
			}

			for (const directory of directories) {
				await recursive(await directory.getFilesAndDirectories(), directory);
			}
		}

		recursive(await root.getFilesAndDirectories(), root);
		*/

		navigator.mozAlarms.getAll().then((alarms) => {
			console.log(alarms);
		});
	}
})();
