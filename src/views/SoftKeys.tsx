import { signal } from "@preact/signals";
import styles from "./SoftKeys.module.scss";
import { VNode } from "preact";

const keys = signal<SoftKeyProps[]>(["", "", ""]);

type SoftKeyProps = VNode | string;

export function setSoftkeys(lsk: SoftKeyProps, center: SoftKeyProps, rsk: SoftKeyProps) {
	keys.value = [lsk, center, rsk];
}

export default function SoftKeys() {
	return (
		<div class={styles.softkeys}>
			{keys.value.map((key) => (
				<div class={styles.softkey}>{key}</div>
			))}
		</div>
	);
}
