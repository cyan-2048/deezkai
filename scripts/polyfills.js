/**
 * this file contains the polyfills that will be loaded before anything else
 * WARNING: the code will also be executed in workers, be cautious in adding polyfills
 */
const s = self;

// this is needed because esbuild es6 transpiled code requires it
Object.getOwnPropertyDescriptors ||= function getOwnPropertyDescriptors(obj) {
	if (obj === null || obj === undefined) {
		throw new TypeError("Cannot convert undefined or null to object");
	}

	const protoPropDescriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");
	const descriptors = protoPropDescriptor ? { ["__proto__"]: protoPropDescriptor } : {};

	for (let name of Object.getOwnPropertyNames(obj)) {
		descriptors[name] = Object.getOwnPropertyDescriptor(obj, name);
	}

	return descriptors;
};

if (s.NodeList) NodeList.prototype.forEach ||= Array.prototype.forEach;

(() => {
	// code stolen here: https://github.com/ustccjw/unhandled-rejection-polyfill/blob/master/src/index.js
	if (typeof PromiseRejectionEvent === "undefined") {
		const Promise = s.Promise;

		function dispatchUnhandledRejectionEvent(promise, reason) {
			const event = document.createEvent("Event");
			Object.defineProperties(event, {
				promise: {
					value: promise,
					writable: false,
				},
				reason: {
					value: reason,
					writable: false,
				},
			});
			event.initEvent("unhandledrejection", false, true);
			s.dispatchEvent(event);
			console.error(promise);
		}

		var MyPromise = function (resolver) {
			if (!(this instanceof MyPromise)) {
				throw new TypeError("Cannot call a class as a function");
			}
			const promise = new Promise((resolve, reject) => {
				const customReject = (reason) => {
					// macro-task(setTimeout) will execute after micro-task(promise)
					setTimeout(() => {
						if (promise.handled !== true) dispatchUnhandledRejectionEvent(promise, reason);
					}, 0);
					return reject(reason);
				};
				try {
					return resolver(resolve, customReject);
				} catch (err) {
					return customReject(err);
				}
			});
			promise.__proto__ = MyPromise.prototype;
			return promise;
		};

		MyPromise.__proto__ = Promise;
		MyPromise.prototype.__proto__ = Promise.prototype;

		MyPromise.prototype.then = function (resolve, reject) {
			return Promise.prototype.then.call(
				this,
				resolve,
				reject &&
					((reason) => {
						this.handled = true;
						return reject(reason);
					})
			);
		};

		MyPromise.prototype.catch = function (reject) {
			return Promise.prototype.catch.call(
				this,
				reject &&
					((reason) => {
						this.handled = true;
						return reject(reason);
					})
			);
		};

		s.Promise = MyPromise;
	}
})();

// Source: https://gitlab.com/ollycross/element-polyfill
(function (arr) {
	function docFragger(args) {
		const docFrag = document.createDocumentFragment();

		args.forEach((argItem) => docFrag.appendChild(argItem instanceof Node ? argItem : document.createTextNode(String(argItem))));

		return docFrag;
	}

	const { defineProperty } = Object;

	function define(item, name, value) {
		defineProperty(item, name, { configurable: true, enumerable: true, writable: true, value });
	}

	arr.forEach(function (item) {
		if (!item) return;
		if (!item.hasOwnProperty("append")) {
			define(item, "append", function append(...args) {
				this.appendChild(docFragger(args));
			});
		}
		if (!item.hasOwnProperty("prepend")) {
			define(item, "prepend", function prepend(...args) {
				this.insertBefore(docFragger(args), this.firstChild);
			});
		}
		if (!item.hasOwnProperty("after")) {
			define(item, "after", function after(...argArr) {
				var docFrag = document.createDocumentFragment();

				argArr.forEach(function (argItem) {
					docFrag.appendChild(argItem instanceof Node ? argItem : document.createTextNode(String(argItem)));
				});

				this.parentNode.insertBefore(docFrag, this.nextSibling);
			});
		}
	});
})([s.Element?.prototype, s.Document?.prototype, s.DocumentFragment?.prototype]);

if (s.Document) {
	// toFix that weird is=undefined attribute that happens because KaiOS tries to do webcomponents but fails miserably
	const createElOriginal = Document.prototype.createElement;

	Document.prototype.createElement = function (type) {
		return createElOriginal.call(this, type);
	};
}

// source: https://github.com/YuzuJS/setImmediate
(function (global, undefined) {
	if (global.setImmediate) {
		return;
	}

	var nextHandle = 1; // Spec says greater than zero
	var tasksByHandle = {};
	var currentlyRunningATask = false;
	var doc = global.document;
	var registerImmediate;

	function setImmediate(callback) {
		// Callback can either be a function or a string
		if (typeof callback !== "function") {
			callback = new Function("" + callback);
		}
		// Copy function arguments
		var args = new Array(arguments.length - 1);
		for (var i = 0; i < args.length; i++) {
			args[i] = arguments[i + 1];
		}
		// Store and register the task
		var task = { callback: callback, args: args };
		tasksByHandle[nextHandle] = task;
		registerImmediate(nextHandle);
		return nextHandle++;
	}

	function clearImmediate(handle) {
		delete tasksByHandle[handle];
	}

	function run(task) {
		var callback = task.callback;
		var args = task.args;
		switch (args.length) {
			case 0:
				callback();
				break;
			case 1:
				callback(args[0]);
				break;
			case 2:
				callback(args[0], args[1]);
				break;
			case 3:
				callback(args[0], args[1], args[2]);
				break;
			default:
				callback.apply(undefined, args);
				break;
		}
	}

	function runIfPresent(handle) {
		// From the spec: "Wait until any invocations of this algorithm started before this one have completed."
		// So if we're currently running a task, we'll need to delay this invocation.
		if (currentlyRunningATask) {
			// Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
			// "too much recursion" error.
			setTimeout(runIfPresent, 0, handle);
		} else {
			var task = tasksByHandle[handle];
			if (task) {
				currentlyRunningATask = true;
				try {
					run(task);
				} finally {
					clearImmediate(handle);
					currentlyRunningATask = false;
				}
			}
		}
	}

	function installNextTickImplementation() {
		registerImmediate = function (handle) {
			process.nextTick(function () {
				runIfPresent(handle);
			});
		};
	}

	function canUsePostMessage() {
		// The test against `importScripts` prevents this implementation from being installed inside a web worker,
		// where `global.postMessage` means something completely different and can't be used for this purpose.
		if (global.postMessage && !global.importScripts) {
			var postMessageIsAsynchronous = true;
			var oldOnMessage = global.onmessage;
			global.onmessage = function () {
				postMessageIsAsynchronous = false;
			};
			global.postMessage("", "*");
			global.onmessage = oldOnMessage;
			return postMessageIsAsynchronous;
		}
	}

	function installPostMessageImplementation() {
		// Installs an event handler on `global` for the `message` event: see
		// * https://developer.mozilla.org/en/DOM/window.postMessage
		// * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

		var messagePrefix = "setImmediate$" + Math.random() + "$";
		var onGlobalMessage = function (event) {
			if (event.source === global && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
				runIfPresent(+event.data.slice(messagePrefix.length));
			}
		};

		if (global.addEventListener) {
			global.addEventListener("message", onGlobalMessage, false);
		} else {
			global.attachEvent("onmessage", onGlobalMessage);
		}

		registerImmediate = function (handle) {
			global.postMessage(messagePrefix + handle, "*");
		};
	}

	function installMessageChannelImplementation() {
		var channel = new MessageChannel();
		channel.port1.onmessage = function (event) {
			var handle = event.data;
			runIfPresent(handle);
		};

		registerImmediate = function (handle) {
			channel.port2.postMessage(handle);
		};
	}

	function installReadyStateChangeImplementation() {
		var html = doc.documentElement;
		registerImmediate = function (handle) {
			// Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
			// into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
			var script = doc.createElement("script");
			script.onreadystatechange = function () {
				runIfPresent(handle);
				script.onreadystatechange = null;
				html.removeChild(script);
				script = null;
			};
			html.appendChild(script);
		};
	}

	function installSetTimeoutImplementation() {
		registerImmediate = function (handle) {
			setTimeout(runIfPresent, 0, handle);
		};
	}

	// If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	// Don't get fooled by e.g. browserify environments.
	if ({}.toString.call(global.process) === "[object process]") {
		// For Node.js before 0.9
		installNextTickImplementation();
	} else if (canUsePostMessage()) {
		// For non-IE10 modern browsers
		installPostMessageImplementation();
	} else if (global.MessageChannel) {
		// For web workers, where supported
		installMessageChannelImplementation();
	} else if (doc && "onreadystatechange" in doc.createElement("script")) {
		// For IE 6–8
		installReadyStateChangeImplementation();
	} else {
		// For older browsers
		installSetTimeoutImplementation();
	}

	attachTo.setImmediate = setImmediate;
	attachTo.clearImmediate = clearImmediate;
})(typeof self === "undefined" ? (typeof global === "undefined" ? this : global) : self);
