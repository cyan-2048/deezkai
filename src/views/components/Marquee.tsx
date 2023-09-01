import { MutableRef, useLayoutEffect, useRef, useState } from "preact/hooks";
import styles from "./Marquee.module.scss";
import { clx } from "@utils";

function isElementOverflowing(element: HTMLElement) {
	var overflowX = element.offsetWidth < element.scrollWidth,
		overflowY = element.offsetHeight < element.scrollHeight;

	return overflowX || overflowY;
}

export default function Marquee(props: { children: string | string[] }) {
	const innerEl = useRef() as MutableRef<HTMLDivElement>;

	const [marque, setMarque] = useState(false);

	useLayoutEffect(() => {
		setMarque(isElementOverflowing(innerEl.current));
		return () => setMarque(false);
	}, [props.children]);

	return (
		<div class={styles.wrap}>
			<div ref={innerEl} class={clx(marque && styles.marquee, styles.inner)}>
				{props.children}
			</div>
		</div>
	);
}
