import { useEffect } from "preact/hooks";
import { back, useInView, useInViewEffect } from "./ViewHandler";
import { register } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";

export default function Settings() {
	useInViewEffect(() => {
		console.log("inview");
		setSoftkeys("Options", "Select", "Back");
		register(
			["Backspace", "SoftRight"],
			() => {
				back();
			},
			{ once: true }
		);
		return () => {
			console.log("no longer in view");
		};
	});

	return (
		<main>
			<h1>Settings</h1>
		</main>
	);
}
