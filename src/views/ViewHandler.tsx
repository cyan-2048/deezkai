import { Signal, batch, signal } from "@preact/signals";
import { Fragment, VNode, createContext, render } from "preact";
import styles from "./ViewHandler.module.scss";
import { EffectCallback, useContext, useEffect } from "preact/hooks";
import { sleep } from "@utils";
import { setSoftkeys } from "./SoftKeys";
import { PureComponent, unmountComponentAtNode } from "preact/compat";

interface View {
	inView: Signal<boolean>;
	el: VNode;
	_vnode: VNode;
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

export function useInViewSignal() {
	return useContext(ViewContext);
}

export function useInViewEffect(cb: EffectCallback) {
	const inViewSignal = useContext(ViewContext);
	useEffect(() => {
		let unsub: (() => void) | void;

		const unsubSignal = inViewSignal.subscribe((val) => {
			if (val) {
				unsub = cb();
			} else {
				unsub?.();
				unsub = undefined;
			}
		});

		return () => {
			unsub?.();
			unsubSignal();
		};
	}, []);
}

interface ForwardOptions {
	noAnimation?: boolean;
	softkeys?: string[];
}

export function forward(el: VNode, options?: ForwardOptions) {
	const current = views.at(-1);

	if (current) {
		// console.log("revoking", current._vnode.type);
		current.inView.value = false;
	}

	const inView = signal(false);
	views.push({
		inView,
		el: <ViewContext.Provider value={inView}>{el}</ViewContext.Provider>,
		_vnode: el,
		id: getID(),
		noAnimation: options?.noAnimation,
		softkeys: options?.softkeys,
	});

	movement.value = [1];
}

export function replace(el: VNode, options: ForwardOptions) {
	// get rid of last view
	views.pop();
	// don't animate
	forward(el, { ...options, noAnimation: true });
}

export function back() {
	console.log("back");
	// you can't go back if there's only one view
	if (views.length == 1) return;
	const removedView = views.pop();
	if (removedView) {
		removedView.inView.value = false;
		previousView = removedView;

		movement.value = [0];
	}
}

const viewClass = styles.view + " ";

interface DOMView {
	current?: VNode;
	dom: HTMLElement;
	inView?: Signal<boolean>;
}

// attempt #2
// for this attempt, will try rendering DOM directly
class ViewHandlerV2 extends PureComponent {
	/**
	 * dom element to manipulate
	 */
	private $$dom!: HTMLElement;

	private $$children: DOMView[] = [];

	mount() {
		const dom = this.$$dom;
		dom.className = viewClass;

		const e = () => {
			const a = document.createElement("main");
			a.className = viewClass;
			return a;
		};

		const a = e(),
			b = e();
		this.$$children.push({ dom: a }, { dom: b });
		dom.appendChild(a);
		dom.appendChild(b);

		movement.subscribe(([move]) => this.update(move));
	}

	update(move: 1 | 0) {
		console.log("movement");
		const currentView = views.at(-1);
		const viewBefore = views[views.length - 2];

		const animated = !currentView?.noAnimation;

		const children = this.$$children;

		let mountedCurrent = false;

		children.forEach((e, i) => {
			const _ = (e: string) => (animated ? e : "");

			const currentMove = viewClass + _(move ? styles.fromRight : styles.fromLeft);

			console.log("child:", i);

			const setup = () => {
				if (currentView) {
					if (currentView.softkeys) setSoftkeys.apply(null, currentView.softkeys as any);
					sleep(500).then(() => {
						delete currentView.noAnimation;
						currentView.inView.value = true;
						console.log("inview", currentView._vnode.type);
					});
				}
			};

			if (viewBefore && e.current == viewBefore._vnode) {
				// view before only occurs when going forward
				e.dom.className = viewClass + _(styles.toLeft);
				console.log("going left");
			} else if (!move && previousView && e.current == previousView._vnode) {
				// previous view only occurs when going back
				e.dom.className = viewClass + _(styles.toRight);
				console.log("going right");
			} else if (currentView && e.current == currentView._vnode) {
				mountedCurrent = true;
				// current view
				e.dom.className = currentMove;
				if (e.inView && e.inView !== currentView.inView) currentView.inView = e.inView;
				console.log("node already mounted", currentView.inView.peek(), currentView._vnode.type);
				setup();
			} else if (!mountedCurrent) {
				mountedCurrent = true;
				// animate the next view
				e.dom.className = currentMove;
				if (e.current && e.current != currentView?._vnode) {
					unmountComponentAtNode(e.dom);
					console.log("unmount");
					delete e.current;
					delete e.inView;
				}
				if (currentView) {
					e.current = currentView._vnode;
					e.inView = currentView.inView;
					console.log("render", e.current.type);
					render(currentView.el, e.dom);
					setup();
				}
			}
		});
	}

	unmount() {
		this.$$children.forEach((a) => {
			unmountComponentAtNode(a.dom);
			a.dom.remove();
		});
		this.$$children.length = 0;
		this.$$dom.remove();
	}

	private $$mainEl(el: HTMLElement | null) {
		console.log("mainEl change:", el);
		if (el) {
			el.appendChild((this.$$dom = document.createElement("main")));
			this.mount();
		} else {
			this.unmount();
		}
	}

	componentWillUnmount(): void {
		this.unmount();
	}

	render() {
		return <main ref={(el) => this.$$mainEl(el)} class={viewClass}></main>;
	}
}

export default ViewHandlerV2;
