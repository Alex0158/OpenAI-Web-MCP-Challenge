import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const PAGE_PATH = resolve(process.cwd(), "src/ui/tenant/tenant-discovery-page.tsx");

test("Discovery keeps local filter validation separate from catalogue read errors", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const applyFilters = page.slice(
    page.indexOf("function applyFilters"),
    page.indexOf("function clearFilters"),
  );
  const filterFeedback = page.slice(
    page.indexOf("filterError"),
    page.indexOf("<FavouriteFeedback"),
  );

  assert.match(page, /const \[filterError, setFilterError\] = useState<string \| null>\(null\);/);
  assert.match(applyFilters, /setFilterError\("Enter a whole-number maximum rent above zero\."\);/);
  assert.match(applyFilters, /setFilterError\("Enter a whole-number minimum size above zero\."\);/);
  assert.match(filterFeedback, /filterError/);
  assert.doesNotMatch(page, /error\.message/);
});

test("Discovery catalogue failures use the existing bounded API error mapping once", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const results = page.slice(page.indexOf("<ListingResults"), page.indexOf("</section>\n    </RolePageFrame>"));

  assert.match(page, /error=\{error instanceof TenantApiError \? error : null\}/);
  assert.match(results, /error=\{error instanceof TenantApiError \? error : null\}/);
  assert.match(page, /tenantApiErrorMessage\(error, "load listings"\)/);
});
