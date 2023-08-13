// ==UserScript==
// @name         system xhr
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://localhost:3000/
// @match        *://*.deezer.com/*
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @grant        window.focus
// @grant        GM.cookie
// ==/UserScript==

(function () {
	"use strict";

	unsafeWindow.unsafeFetch = (...args) => {
		console.log("unsafeFetch", ...args);
		return GM_fetch(...args);
	};
	unsafeWindow.unsafeFocus = () => window.focus();
	// Your code here...

	unsafeWindow.GM_cookie = GM.cookie;

	const originalAudio = unsafeWindow.Audio;

	unsafeWindow.Audio = function () {
		const audio = new originalAudio(...arguments);
		console.log("Audio created", audio);
		return audio;
	};
})();

var GM_fetch = (function () {
	"use strict";

	function parseRawHeaders(h) {
		const s = h.trim();
		if (!s) {
			return new Headers();
		}
		const array = s.split("\r\n").map((value) => {
			let s = value.split(":");
			return [s[0].trim(), encodeURIComponent(s[1].trim())];
		});
		return new Headers(array);
	}
	function parseGMResponse(req, res) {
		return new ResImpl(res.response, {
			statusCode: res.status,
			statusText: res.statusText,
			headers: parseRawHeaders(res.responseHeaders),
			finalUrl: res.finalUrl,
			redirected: res.finalUrl === req.url,
		});
	}
	class ResImpl {
		constructor(body, init) {
			this.rawBody = body;
			this.init = init;
			this.body = toReadableStream(body);
			const { headers, statusCode, statusText, finalUrl, redirected } = init;
			this.headers = headers;
			this.status = statusCode;
			this.statusText = statusText;
			this.url = finalUrl;
			this.type = "basic";
			this.redirected = redirected;
			this._bodyUsed = false;
		}
		get bodyUsed() {
			return this._bodyUsed;
		}
		get ok() {
			return this.status < 300;
		}
		arrayBuffer() {
			if (this.bodyUsed) {
				throw new TypeError("Failed to execute 'arrayBuffer' on 'Response': body stream already read");
			}
			this._bodyUsed = true;
			return this.rawBody.arrayBuffer();
		}
		blob() {
			if (this.bodyUsed) {
				throw new TypeError("Failed to execute 'blob' on 'Response': body stream already read");
			}
			this._bodyUsed = true;
			// `slice` will use empty string as default value, so need to pass all arguments.
			return Promise.resolve(this.rawBody.slice(0, this.rawBody.size, this.rawBody.type));
		}
		clone() {
			if (this.bodyUsed) {
				throw new TypeError("Failed to execute 'clone' on 'Response': body stream already read");
			}
			return new ResImpl(this.rawBody, this.init);
		}
		formData() {
			if (this.bodyUsed) {
				throw new TypeError("Failed to execute 'formData' on 'Response': body stream already read");
			}
			this._bodyUsed = true;
			return this.rawBody.text().then(decode);
		}
		async json() {
			if (this.bodyUsed) {
				throw new TypeError("Failed to execute 'json' on 'Response': body stream already read");
			}
			this._bodyUsed = true;
			return JSON.parse(await this.rawBody.text());
		}
		text() {
			if (this.bodyUsed) {
				throw new TypeError("Failed to execute 'text' on 'Response': body stream already read");
			}
			this._bodyUsed = true;
			return this.rawBody.text();
		}
	}
	function decode(body) {
		const form = new FormData();
		body
			.trim()
			.split("&")
			.forEach(function (bytes) {
				if (bytes) {
					const split = bytes.split("=");
					const name = split.shift()?.replace(/\+/g, " ");
					const value = split.join("=").replace(/\+/g, " ");
					form.append(decodeURIComponent(name), decodeURIComponent(value));
				}
			});
		return form;
	}
	function toReadableStream(value) {
		return new ReadableStream({
			start(controller) {
				controller.enqueue(value);
				controller.close();
			},
		});
	}

	async function GM_fetch(input, init) {
		const request = new Request(input, init);
		let data;
		if (init?.body) {
			data = await request.text();
		}
		return await XHR(request, init, data);
	}
	function XHR(request, init = {}, data) {
		return new Promise((resolve, reject) => {
			if (request.signal && request.signal.aborted) {
				return reject(new DOMException("Aborted", "AbortError"));
			}
			console.log(init.headers);
			GM.xmlHttpRequest({
				url: request.url,
				method: gmXHRMethod(request.method.toUpperCase()),
				headers: { cookie: "", ...init.headers },
				cookie: init.headers?.cookie | "",
				fetch: true,
				data: data,
				responseType: "blob",
				onload(res) {
					resolve(parseGMResponse(request, res));
				},
				onabort() {
					reject(new DOMException("Aborted", "AbortError"));
				},
				ontimeout() {
					reject(new TypeError("Network request failed, timeout"));
				},
				onerror(err) {
					reject(new TypeError("Failed to fetch: " + err.finalUrl));
				},
			});
		});
	}
	const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "TRACE", "OPTIONS", "CONNECT"];
	// a ts type helper to narrow type
	function includes(array, element) {
		return array.includes(element);
	}
	function gmXHRMethod(method) {
		if (includes(httpMethods, method)) {
			return method;
		}
		throw new Error(`unsupported http method ${method}`);
	}

	return GM_fetch;
})();
