import { register } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";
import { back, useInViewEffect } from "./ViewHandler";

export default function Player() {
	useInViewEffect(() => {
		setSoftkeys("Options", "Pause", "Back");

		register(
			"Backspace",
			() => {
				back();
			},
			{ once: true, preventDefault: true }
		);
	});
	return <h1>Player</h1>;
}
