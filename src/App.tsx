import { useEffect, useMemo } from "preact/hooks";
import SoftKeys, { setSoftkeys } from "./views/SoftKeys";
import ViewHandler, { back, forward, useInView, useInViewEffect } from "./views/ViewHandler";
import { register } from "./lib/keys";
import Home from "./views/Home";
import Player from "./views/Player";

function getRandomColor() {
	const letters = "0123456789ABCDEF";
	let color = "#";

	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}

	return color;
}

function TestView() {
	const id = useMemo(() => getRandomColor(), []);

	useInViewEffect(() => {
		const registeredKey = register(["Enter", "Backspace"], (e) => {
			if (e.key === "Backspace") return back();
			forward(<TestView />);
		});

		return () => registeredKey.unregister();
	});

	return (
		<main style={{ height: "100vh", padding: 5, backgroundColor: id }}>
			{`The quick brown fox jumps over the lazy dog.
			`.repeat(8)}
		</main>
	);
}

// forward(<TestView />);

forward(<Home />, {
	noAnimation: true,
	softkeys: ["Options", "Open", "Exit"],
});

Object.assign(window, {
	openPlayer() {
		forward(<Player />, {
			softkeys: ["Options", "", "Back"],
		});
	},
});

export function App() {
	return (
		<main>
			<ViewHandler />
			<SoftKeys />
		</main>
	);
}
