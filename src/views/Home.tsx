import { signal } from "@preact/signals";
import styles from "./Home.module.scss";
import { useEffect } from "preact/hooks";
import { Navigation, register, unregister } from "src/lib/keys";
import { forward, useInView, useInViewEffect } from "./ViewHandler";
import Downloads from "./Downloads";
import { setSoftkeys } from "./SoftKeys";
import { JSX } from "preact/jsx-runtime";
import Header from "./components/Header";

const nav = new Navigation(4);

function HomeListItem(props: { children: JSX.Element; title: string; description: string }) {
	return (
		<div class={styles.item}>
			<div class={styles.icon}>{props.children}</div>
			<div class={styles.text}>
				<div>{props.title}</div>
				<div>{props.description}</div>
			</div>
		</div>
	);
}

const _downloads = <Downloads />;

export default function Home() {
	useInViewEffect(() => {
		setSoftkeys("Options", "Open", "Exit");

		const keys = [
			register("Enter", () => {
				const currentIndex = nav.getIndex();
				if (currentIndex == 3) {
					forward(_downloads, { softkeys: ["Options", "Select", "Back"] });
				}
			}),
		];

		console.log("keys registered for Home");

		const unsub_nav = nav.register();

		return () => {
			unregister.apply(null, keys);
			unsub_nav();
			console.log("keys unregistered for Home");
		};
	});

	const focusedIndex = nav.index.value;

	return (
		<main>
			<Header>DeezKai</Header>
			<div class={styles.body}>
				<div style={{ top: focusedIndex * 66 }} class={styles["focus-item"]}></div>
				<HomeListItem title="Tracks" description="Find your music">
					<svg class={(focusedIndex == 0 || "") && styles.iconFocus} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
						<path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z" />
						<path fill-rule="evenodd" d="M9 3v10H8V3h1z" />
						<path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z" />
					</svg>
				</HomeListItem>
				<HomeListItem title="Albums" description="Search for albums">
					<svg class={(focusedIndex == 1 || "") && styles.iconFocus} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
						<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-6 0a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM4 8a4 4 0 0 1 4-4 .5.5 0 0 0 0-1 5 5 0 0 0-5 5 .5.5 0 0 0 1 0zm9 0a.5.5 0 1 0-1 0 4 4 0 0 1-4 4 .5.5 0 0 0 0 1 5 5 0 0 0 5-5z" />
					</svg>
				</HomeListItem>
				<HomeListItem title="Artists" description="Search for artists">
					<svg class={(focusedIndex == 2 || "") && styles.iconFocus} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
						<path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1h-2z" />
					</svg>
				</HomeListItem>
				<HomeListItem title="Downloads" description="Listen to music offline">
					<svg class={(focusedIndex == 3 || "") && styles.iconFocus} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
						<path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM8 5a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 9.293V5.5A.5.5 0 0 1 8 5z" />
					</svg>
				</HomeListItem>
			</div>
		</main>
	);
}
