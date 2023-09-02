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
		const time = 3000;

		let timeout: any;

		const setTransform = () => {
			element.style.transform = `translateX(${-marquee + "px"})`;
			timeout = setTimeout(() => {
				element.style.transform = "";
				timeout = setTimeout(setTransform, time);
			}, time);
		};

		if (typeof marquee == "number") {
			timeout = setTimeout(setTransform, time);
		} else {
			element.style.transform = "";
			clearTimeout(timeout);
		}

		return () => clearTimeout(timeout);
	}, [marquee]);

	return (
		<div class={styles.wrap}>
			<div ref={innerEl} style={{ "--slide": marquee == false ? null : `translateX(${-marquee + "px"})` }} class={clx(typeof marquee == "number" && styles.marquee, styles.inner)}>
				{props.children}
			</div>
		</div>
	);
}
