import EventTarget from "@ungap/event-target";

export default class EventEmitter<T extends string = string, R extends Record<string, any> = any> extends EventTarget {
	on<K extends T>(type: K, callback: (res: CustomEvent<R[K]>) => void) {
		this.addEventListener(type, callback as EventListener);
	}
	off(type: T, callback: EventListenerOrEventListenerObject) {
		this.removeEventListener(type, callback);
	}
	once<K extends T>(type: K, callback: (res: CustomEvent<R[K]>) => void) {
		this.addEventListener(type, callback as EventListener, { once: true });
	}
	emit(type: T, detail?: any) {
		this.dispatchEvent(new CustomEvent(type, { detail }));
	}
}
