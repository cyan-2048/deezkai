import EventTarget from "@ungap/event-target";

export default class EventEmitter<T extends string = string> extends EventTarget {
	on(type: T, callback: EventListenerOrEventListenerObject) {
		this.addEventListener(type, callback);
	}
	off(type: T, callback: EventListenerOrEventListenerObject) {
		this.removeEventListener(type, callback);
	}
	once(type: T, callback: EventListenerOrEventListenerObject) {
		this.addEventListener(type, callback, { once: true });
	}
	emit(type: T, detail?: any) {
		this.dispatchEvent(new CustomEvent(type, { detail }));
	}
}
