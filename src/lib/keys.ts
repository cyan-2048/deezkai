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

class RegisteredKey<T extends string = any> {
	bubble: boolean;
	once: boolean;

	constructor(public key: T, public cb: (e: CustomKeyboardEvent<T>) => any, options: RegisterOptions) {
		this.bubble = options.bubble ?? true;
		this.once = options.once ?? false;
		registeredKeys.unshift(this);
	}

	trigger(e: CustomKeyboardEvent<T>) {
		this.cb(e);
		if (this.once) {
			this.unregister();
		}
	}

	unregister() {
		registeredKeys.splice(registeredKeys.indexOf(this), 1);
	}
}

export function register<T extends string = any>(key: T, callback: (e: CustomKeyboardEvent<T>) => any, options: RegisterOptions = {}) {
	return new RegisteredKey(key, callback, options);
}

document.addEventListener(
	"keydown",
	(e) => {
		// loop through registeredKeys
		for (let i = 0; i < registeredKeys.length; i++) {
			// if key is registered, then trigger the callback
			const registeredKey = registeredKeys[i];

			if (registeredKey.key === e.key) {
				registeredKey.trigger(e);

				if (!registeredKey.bubble) {
					break;
				}
			}
		}
	},
	true
);
