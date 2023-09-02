import * as settings from "@settings";
import * as deezer from "d-fi-core";
import * as utils from "@utils";
import * as React from "preact";
import * as jobs from "./lib/jobs";

import { Buffer } from "d-fi-core/src/lib/buffer.js";

// import "./lib/xhr.js";

import * as views from "./views/ViewHandler.js";

Object.assign(window, { settings, deezer, utils, React, views, jobs, Buffer });

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
