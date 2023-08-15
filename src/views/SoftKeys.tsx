import { signal } from "@preact/signals";
import styles from "./SoftKeys.module.scss";

const keys = signal(["LSK", "Center", "RSK"]);

export function setSoftkeys(lsk: string, center: string, rsk: string) {
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
