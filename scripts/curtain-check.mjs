// Drives a real Chrome over CDP to prove the title page behaves as a
// one-way threshold. Not a unit test of the component — the behaviour under
// test IS scrolling, and scrolling only exists in a browser.
import WebSocket from "ws";

const CDP = process.env.CDP ?? "http://127.0.0.1:9222";
const URL_UNDER_TEST = process.env.TARGET ?? "http://localhost:3115/";

const targets = await (await fetch(`${CDP}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 64 << 20 });
await new Promise((r) => ws.once("open", r));

let id = 0;
const pending = new Map();
ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: URL_UNDER_TEST });
await sleep(3500);

const q = `document.querySelector('section[aria-label="RVB Partners"]')`;
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

// 1. The panel is there on arrival, and it is one viewport tall.
const h = await evaluate(`${q} ? ${q}.offsetHeight : null`);
check("title page present on arrival", h !== null, `height ${h}`);
const vh = await evaluate("window.innerHeight");
check("panel is one viewport tall", Math.abs(h - vh) <= 2, `panel ${h} vs viewport ${vh}`);

// 2. Scrolling only PART way must NOT remove it — the removal has to happen
//    off-screen or the reader sees a jump.
await evaluate(`window.scrollTo(0, ${Math.round(h * 0.5)})`);
await sleep(500);
check(
  "partial scroll leaves it in place",
  (await evaluate(`${q} !== null`)) === true,
  `at scrollY ${await evaluate("window.scrollY")}`,
);

// 3. Scrolling clear of it removes it, and the scroll offset is corrected by
//    exactly the panel height so nothing appears to move.
// The h1's position in the DOCUMENT, not in the viewport, so it stays
// comparable across a scroll.
const docPosBefore = await evaluate(
  `document.querySelector('h1').getBoundingClientRect().top + window.scrollY`,
);
await evaluate(`window.scrollTo(0, ${Math.round(h + 400)})`);
await sleep(700);
const gone = (await evaluate(`${q} === null`)) === true;
check("scrolling clear of it removes it", gone);
const y = await evaluate("window.scrollY");
check("scroll offset corrected by the panel height", Math.abs(y - 400) <= 2, `scrollY ${y}, expected ~400`);

// 4. THE POINT OF THE WHOLE CHANGE: scrolling back to the top now lands on the
//    register, not on the title page.
await evaluate("window.scrollTo(0, 0)");
await sleep(400);
check("cannot scroll back into the title page", (await evaluate(`${q} === null`)) === true);
const topText = await evaluate(
  `(document.querySelector('h1')?.innerText ?? '').trim().slice(0, 60)`,
);
check(
  "top of the document is the register",
  topText.startsWith("RVB Partners is a systematic"),
  JSON.stringify(topText),
);
// Removing a 100svh block moves everything below it up by exactly its own
// height. That is the shift the scroll correction has to cancel, so assert the
// shift is what we think it is — if it ever isn't, the correction is wrong and
// the reader sees a full-screen jump.
const docPosAfter = await evaluate(
  `document.querySelector('h1').getBoundingClientRect().top + window.scrollY`,
);
check(
  "content shifted up by exactly the panel height",
  Math.abs(docPosBefore - docPosAfter - h) <= 2,
  `h1 sat at ${Math.round(docPosBefore)} in the document, now ${Math.round(
    docPosAfter,
  )}; shift ${Math.round(docPosBefore - docPosAfter)} vs panel ${h}`,
);

ws.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
