import { useEffect, useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import viteLogo from "/vite.svg";
import { Decrypt, Download } from "./lib/jobs";
import { sleep } from "@utils";

function Progress() {
	const [state, setState] = useState("Downloading");
	const [progress, setProgress] = useState(0);
	const [jobState, setJobState] = useState("unknown");

	useEffect(() => {
		const download = new Download("1");
		setJobState(download.state);

		download.on("progress", (progress) => {
			setProgress(progress.detail);
		});

		download.on("state", (state) => {
			setJobState(download.state);
		});

		download.promise.then(async (data) => {
			await sleep(1500);

			setProgress(0);
			setState("Decrypting");

			const decrypt = new Decrypt(data);
			setJobState(decrypt.state);

			decrypt.on("state", (state) => {
				setJobState(decrypt.state);
			});

			decrypt.on("progress", (progress) => {
				setProgress(progress.detail);
			});
		});
	}, []);

	return (
		<div class="progress">
			{state} - {progress}% - {jobState}
		</div>
	);
}

export function App() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const handle = () => setCount((count) => count + 1);
		window.addEventListener("keydown", handle);
		return () => window.removeEventListener("keydown", handle);
	}, []);

	return (
		<>
			<div>
				<a href="https://vitejs.dev" target="_blank">
					<img src={viteLogo} class="logo" alt="Vite logo" />
				</a>
				<a href="https://preactjs.com" target="_blank">
					<img src={preactLogo} class="logo preact" alt="Preact logo" />
				</a>
			</div>
			<h1>Vite + Preact</h1>
			<div class="card">
				<button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
				<p>
					Edit <code>src/app.tsx</code> and save to test HMR
				</p>
			</div>
			{Array(10)
				.fill(0)
				.map((_, i) => (
					<Progress key={i} />
				))}
			<p class="read-the-docs">Click on the Vite and Preact logos to learn more</p>
		</>
	);
}
