import { MutableRef, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import styles from "./Marquee.module.scss";
import { clx } from "@utils";

function isElementOverflowing(element: HTMLElement) {
	var overflowX = element.offsetWidth < element.scrollWidth,
		overflowY = element.offsetHeight < element.scrollHeight;

	return overflowX || overflowY;
}

export default function Marquee(props: { children: string | string[] }) {
	const innerEl = useRef() as MutableRef<HTMLDivElement>;

	const [marquee, setMarquee] = useState<number | false>(false);

	useEffect(() => {
		const element = innerEl.current;
		setMarquee(isElementOverflowing(element) && element.scrollWidth - element.offsetWidth);
		return () => setMarquee(false);
	}, [props.children]);

	useEffect(() => {
		const element = innerEl.current;

		let timeout: any;

		const string = typeof props.children == "string" ? props.children : props.children.join(" ");
		const preciseTime = string.length / 15;
		const time = Math.ceil(preciseTime) * 1000 + 2000;

		const setTransform = () => {
			element.style.transform = `translateX(${-marquee + "px"})`;
			element.style.setProperty("--time", preciseTime.toFixed(2) + "s");
			timeout = setTimeout(() => {
				element.style.transform = "";
				timeout = setTimeout(setTransform, time);
			}, time);
		};

		if (typeof marquee == "number") {
			timeout = setTimeout(setTransform, 2000);
		}

		return () => clearTimeout(timeout);
	}, [marquee, props.children]);

	return (
		<div class={styles.wrap}>
			<div ref={innerEl} class={clx(typeof marquee == "number" && styles.marquee, styles.inner)}>
				{props.children}
			</div>
		</div>
	);
}
