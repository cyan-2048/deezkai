import { setSoftkeys } from "./SoftKeys";
import { useInViewEffect } from "./ViewHandler";

export default function Player() {
	useInViewEffect(() => {
		setSoftkeys("Options", "Pause", "Back");
	});
	return <h1>Player</h1>;
}
