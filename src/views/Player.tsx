import { register } from "src/lib/keys";
import { setSoftkeys } from "./SoftKeys";
import { back, useInViewEffect, useInViewSignal } from "./ViewHandler";
import styles from "./Player.module.scss";
import Marquee from "./components/Marquee";
import { Fragment, h } from "preact";

function MarqueeOrNot(props: Parameters<typeof Marquee>[0]) {
	const inView = useInViewSignal();
	return h((inView.value ? Marquee : Fragment) as any, props);
}

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
	return (
		<main class={styles.view}>
			<div class={styles.cover}></div>
			<div class={styles.bottom}>
				<div class={styles.text}>
					<MarqueeOrNot>Taylor Swift - Sparks Fly (Taylor's Version) - Speak Now (Taylor's Version)</MarqueeOrNot>
				</div>
			</div>
			<div class={styles.progress}>
				<div style={{ width: "90%" }} class={styles.bar}></div>
			</div>
		</main>
	);
}
