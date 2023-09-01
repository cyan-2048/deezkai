// this file will handle how the keyboard is being used

import { Signal, signal } from "@preact/signals";

interface RegisterOptions {
	/**
	 * remove after triggered
	 */
	once?: boolean;
	/**
	 * propagate the key event to the next registered key
	 */
	bubble?: boolean;
	/**
	 * prevent default behavior
	 */
	preventDefault?: boolean;
}

const registeredKeys: RegisteredKey[] = [];

interface CustomKeyboardEvent<T extends string = any> extends KeyboardEvent {
	key: T;
}

class RegisteredKey<T extends string | string[] = any> {
	bubble: boolean;
	once: boolean;
	preventDefault: boolean;

	constructor(public key: T, public cb: (e: CustomKeyboardEvent<T extends string[] ? T[number] : T>) => any, options: RegisterOptions) {
		this.bubble = options.bubble ?? true;
		this.once = options.once ?? false;
		this.preventDefault = options.preventDefault ?? false;
		registeredKeys.unshift(this);
	}

	trigger(e: CustomKeyboardEvent<T extends string[] ? T[number] : T>) {
		this.cb(e);
		if (this.once) {
			this.unregister();
		}
	}

	unregister() {
		registeredKeys.splice(registeredKeys.indexOf(this), 1);
	}
}

export function register<T extends string | string[] = any>(key: T, callback: (e: CustomKeyboardEvent<T extends string[] ? T[number] : T>) => any, options: RegisterOptions = {}) {
	return new RegisteredKey(key, callback, options);
}

export function unregister(...keys: (RegisteredKey | (() => void))[]) {
	keys.forEach((e) => {
		if (typeof e === "function") return e();
		e.unregister();
	});
}

window.addEventListener(
	"keydown",
	(e) => {
		// loop through registeredKeys
		for (let i = 0; i < registeredKeys.length; i++) {
			// if key is registered, then trigger the callback
			const registeredKey = registeredKeys[i];

			if (Array.isArray(registeredKey.key) ? registeredKey.key.includes(e.key) : registeredKey.key === e.key) {
				registeredKey.preventDefault && e.preventDefault();
				registeredKey.trigger(e);

				if (!registeredKey.bubble) {
					break;
				}
			}
		}
		console.log("registeredKeys", registeredKeys);
	},
	true
);

export class Navigation {
	index = signal(0);

	constructor(private arr: Signal<any[]> | number) {}

	getIndex() {
		return this.index.peek();
	}

	getLength() {
		if (typeof this.arr === "number") return this.arr;
		return this.arr.peek().length;
	}

	register() {
		const keys: Parameters<typeof unregister> = [
			register("ArrowUp", (e) => {
				if (!this.getLength()) return;
				if (!this.getIndex()) return e.repeat ? null : (this.index.value = this.getLength() - 1);
				this.index.value--;
			}),
			register("ArrowDown", (e) => {
				if (!this.getLength()) return;
				if (this.getIndex() === this.getLength() - 1) return e.repeat ? null : (this.index.value = 0);
				this.index.value++;
			}),
		];

		if (typeof this.arr !== "number") {
			keys.push(
				this.arr.subscribe((arr) => {
					if (this.getLength() === 0) {
						this.index.value = 0;
						return;
					}

					if (this.getIndex() === arr.length) {
						this.index.value = arr.length - 1;
					}
				})
			);
		}

		return () => unregister(...keys);
	}
}

// @ts-ignore
import scrollIntoView from "scroll-into-view";

export function centerScroll(el: HTMLElement, sync = false, time = 100) {
	return new Promise((res) => {
		scrollIntoView(el, { time: sync ? 0 : time, align: { left: 0 }, ease: (e: number) => e }, (type: string) => res(type === "complete"));
	});
}
