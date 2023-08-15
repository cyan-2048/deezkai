import { useEffect } from "preact/hooks";
import { back, useInView } from "./ViewHandler";
import { register } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";

export default function Settings() {
	const inView = useInView();
	useEffect(() => {
		if (inView) {
			setSoftkeys("Options", "Select", "Back");
			register(
				"Backspace",
				() => {
					back();
				},
				{ once: true }
			);
		}
	}, [inView]);

	return (
		<main>
			<h1>Settings</h1>
		</main>
	);
}
