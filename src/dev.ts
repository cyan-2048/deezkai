import * as settings from "@settings";
import * as deezer from "d-fi-core";
import * as utils from "@utils";
import * as React from "preact";
import * as jobs from "./lib/jobs";

import { Buffer } from "d-fi-core/src/lib/buffer.js";

// import "./lib/xhr.js";

import * as views from "./views/ViewHandler.js";

Object.assign(window, { settings, deezer, utils, React, views, jobs, Buffer, disableScroll, enableScroll });

function softkey(e: KeyboardEvent) {
	const { target, key, bubbles, cancelable, repeat, type } = e;
	if (!/Left|Right/.test(key) || !key.startsWith("Arrow") || !e.ctrlKey) return;
	e.stopImmediatePropagation();
	e.stopPropagation();
	e.preventDefault();
	target?.dispatchEvent(new KeyboardEvent(type, { key: "Soft" + key.slice(5), bubbles, cancelable, repeat }));
}

document.addEventListener("keyup", softkey, true);
document.addEventListener("keydown", softkey, true);

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = { 37: 1, 38: 1, 39: 1, 40: 1 } as Record<number, number>;

function preventDefault(e: Event) {
	e.preventDefault();
}

function preventDefaultForScrollKeys(e: KeyboardEvent) {
	if (keys[e.keyCode]) {
		preventDefault(e);
		return false;
	}
}

// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
	window.addEventListener(
		"test",
		() => {},
		Object.defineProperty({}, "passive", {
			get: function () {
				supportsPassive = true;
			},
		})
	);
} catch (e) {}

var wheelOpt: any = supportsPassive ? { passive: false } : false;
var wheelEvent: any = "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";

// call this to Disable
function disableScroll() {
	window.addEventListener("DOMMouseScroll", preventDefault, false); // older FF
	window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
	window.addEventListener("touchmove", preventDefault, wheelOpt); // mobile
	window.addEventListener("keydown", preventDefaultForScrollKeys, false);
}

// call this to Enable
function enableScroll() {
	window.removeEventListener("DOMMouseScroll", preventDefault, false);
	window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
	window.removeEventListener("touchmove", preventDefault, wheelOpt);
	window.removeEventListener("keydown", preventDefaultForScrollKeys, false);
}

disableScroll();
