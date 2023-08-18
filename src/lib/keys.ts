// this file will handle how the keyboard is being used

interface RegisterOptions {
	/**
	 * remove after triggered
	 */
	once?: boolean;
	/**
	 * propagate the key event to the next registered key
	 */
	bubble?: boolean;
}

const registeredKeys: RegisteredKey[] = [];

interface CustomKeyboardEvent<T extends string = any> extends KeyboardEvent {
	key: T;
}

class RegisteredKey<T extends string | string[] = any> {
	bubble: boolean;
	once: boolean;

	constructor(public key: T, public cb: (e: CustomKeyboardEvent<T extends string[] ? T[number] : T>) => any, options: RegisterOptions) {
		this.bubble = options.bubble ?? true;
		this.once = options.once ?? false;
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

export function unregister(...keys: RegisteredKey[]) {
	keys.forEach((e) => e.unregister());
}

document.addEventListener(
	"keydown",
	(e) => {
		// loop through registeredKeys
		for (let i = 0; i < registeredKeys.length; i++) {
			// if key is registered, then trigger the callback
			const registeredKey = registeredKeys[i];

			if (Array.isArray(registeredKey.key) ? registeredKey.key.includes(e.key) : registeredKey.key === e.key) {
				registeredKey.trigger(e);

				if (!registeredKey.bubble) {
					break;
				}
			}
		}
	},
	true
);
