import { FunctionalComponent } from "preact";
import styles from "./Header.module.scss";

export default ((props) => {
	return <div class={styles.header}>{props.children}</div>;
}) as FunctionalComponent;
