import { Signal, batch, signal } from "@preact/signals";
import { Fragment, VNode, createContext } from "preact";
import styles from "./ViewHandler.module.scss";
import { useContext, useEffect } from "preact/hooks";
import { sleep } from "@utils";
import { setSoftkeys } from "./SoftKeys";

interface View {
	inView: Signal<boolean>;
	el: VNode;
	id: string;
	noAnimation?: boolean;
	softkeys?: string[];
}

const ViewContext = createContext<Signal<boolean>>(signal(false));

const views: View[] = [];
let previousView: View | null = null;

const movement = signal<[1 | 0]>([1]);

let id = 0;

function getID() {
	id++;
	return "view" + id;
}

export function useInView() {
	return useContext(ViewContext).value;
}

export function forward(el: VNode, noAnimation?: boolean, softkeys?: string[]) {
	const current = views.at(-1);

	if (current) current.inView.value = false;

	const inView = signal(false);
	views.push({
		inView,
		el: <ViewContext.Provider value={inView}>{el}</ViewContext.Provider>,
		id: getID(),
		noAnimation,
		softkeys,
	});

	movement.value = [1];
}

export function back() {
	// you can't go back if there's only one view
	if (views.length == 1) return;
	const removedView = views.pop();
	if (removedView) {
		removedView.inView.value = false;
		previousView = removedView;

		movement.value = [0];
	}
}

export default function ViewHandler() {
	const currentView = views.at(-1);
	const viewBefore = views[views.length - 2];
	const _move = movement.value;
	const [move] = _move;

	useEffect(() => {
		sleep(500).then(() => {
			delete currentView?.noAnimation;
			if (currentView) currentView.inView.value = true;
		});
	}, [_move]);

	useEffect(() => {
		if (currentView?.softkeys) setSoftkeys.apply(null, currentView.softkeys as any);
	}, [currentView]);

	const viewClass = styles.view + " ";

	return currentView ? (
		<main class={viewClass}>
			<div class={viewClass + (!currentView.noAnimation && (move ? styles.fromRight : styles.fromLeft)) || ""} key={currentView.id}>
				<Fragment key={currentView.id}>{currentView.el}</Fragment>
			</div>
			{!!move && viewBefore && (
				<div class={viewClass + styles.toLeft} key={viewBefore.id}>
					<Fragment key={viewBefore.id}>{viewBefore.el}</Fragment>
				</div>
			)}
			{!move && previousView && (
				<div class={viewClass + styles.toRight} key={previousView.id}>
					<Fragment key={previousView.id}>{previousView.el}</Fragment>
				</div>
			)}
		</main>
	) : null;
}
