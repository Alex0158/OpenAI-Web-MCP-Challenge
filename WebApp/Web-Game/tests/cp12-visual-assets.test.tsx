import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { isVisualIconId, VISUAL_ICON_IDS, VisualIcon } from "../src/client/visual-icons";

test("the visual registry keeps the accepted CP-12 icon IDs stable", () => {
  assert.deepEqual(VISUAL_ICON_IDS, [
    "icon_wood",
    "icon_rock",
    "icon_pickaxe",
    "icon_sword",
    "icon_cargo",
    "icon_coin",
    "icon_warning",
    "icon_landmark",
  ]);
  assert.equal(isVisualIconId("icon_wood"), true);
  assert.equal(isVisualIconId("icon_missing"), false);
});

test("a known icon renders a deterministic accessible-safe 24 by 24 SVG", () => {
  const first = renderToStaticMarkup(<VisualIcon name="icon_wood" className="icon" />);
  const second = renderToStaticMarkup(<VisualIcon name="icon_wood" className="icon" />);

  assert.equal(first, second);
  assert.match(first, /<svg/);
  assert.match(first, /data-asset-id="icon_wood"/);
  assert.match(first, /viewBox="0 0 24 24"/);
  assert.match(first, /width="24"/);
  assert.match(first, /height="24"/);
  assert.match(first, /aria-hidden="true"/);
  assert.match(first, /class="icon"/);
});

test("a labelled icon exposes an image role without duplicating the visible text label", () => {
  const markup = renderToStaticMarkup(<VisualIcon name="icon_coin" label="Coins" />);

  assert.match(markup, /role="img"/);
  assert.match(markup, /aria-label="Coins"/);
  assert.doesNotMatch(markup, /aria-hidden="true"/);
});

test("an unknown asset renders a deterministic visible fallback marker", () => {
  const first = renderToStaticMarkup(<VisualIcon name="icon_missing" />);
  const second = renderToStaticMarkup(<VisualIcon name="icon_missing" />);

  assert.equal(first, second);
  assert.match(first, /data-asset-id="unknown"/);
  assert.match(first, /data-asset-fallback="true"/);
  assert.match(first, /data-requested-asset="icon_missing"/);
  assert.match(first, /<path/);
});
