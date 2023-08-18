import { useEffect, useMemo } from "preact/hooks";
import SoftKeys, { setSoftkeys } from "./views/SoftKeys";
import ViewHandler, { back, forward, useInView } from "./views/ViewHandler";
import { register } from "./lib/keys";
import Home from "./views/Home";

function getRandomColor() {
	const letters = "0123456789ABCDEF";
	let color = "#";

	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}

	return color;
}

function TestView() {
	const inView = useInView();

	const id = useMemo(() => getRandomColor(), []);

	useEffect(() => {
		console.log("inView", inView);
		if (inView) {
			const registeredKey = register("Enter", () => {
				forward(<TestView />);
			});

			return () => registeredKey.unregister();
		}
	}, [inView]);

	return (
		<main style={{ height: "100vh", padding: 5, backgroundColor: id }}>
			{`The quick brown fox jumps over the lazy dog.
			`.repeat(8)}
		</main>
	);
}

forward(<Home />, {
	noAnimation: true,
	softkeys: ["Options", "Open", "Exit"],
});

export function App() {
	useEffect(() => {
		const registeredKey = register("Backspace", (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();

			back();
		});

		return () => registeredKey.unregister();
	}, []);

	return (
		<main>
			<ViewHandler />
			<SoftKeys />
		</main>
	);
}
