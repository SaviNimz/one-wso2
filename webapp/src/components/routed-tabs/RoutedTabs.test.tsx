// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import RoutedTabs, { type RoutedTabDef } from "./RoutedTabs";

const TABS: readonly RoutedTabDef[] = [
  { segment: "one", label: "One" },
  { segment: "two", label: "Two" },
];

function UrlProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="url">{pathname + search}</div>;
}

function renderTabs(
  url: string,
  props: { tabs?: readonly RoutedTabDef[]; keepSearchParams?: readonly string[] } = {},
) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <RoutedTabs
        basePath="/app"
        tabs={props.tabs ?? TABS}
        ariaLabel="Sections"
        keepSearchParams={props.keepSearchParams}
      />
      <UrlProbe />
    </MemoryRouter>,
  );
}

describe("without keepSearchParams (the default)", () => {
  it("links each tab to its bare path, dropping the query string", () => {
    renderTabs("/app/one?month=2026-11");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("href", "/app/two");
  });

  it("lights the tab the URL names", () => {
    renderTabs("/app/two?month=2026-11");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "false");
  });

  it("treats an empty list as off", () => {
    renderTabs("/app/one?month=2026-11", { keepSearchParams: [] });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("href", "/app/two");
  });
});

describe("with keepSearchParams", () => {
  it("carries only the named parameters into every tab's link", () => {
    renderTabs("/app/one?bu=API&month=2026-11&region=Europe", { keepSearchParams: ["month"] });
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("href", "/app/one?month=2026-11");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("href", "/app/two?month=2026-11");
  });

  it("keeps the named parameters across a switch and drops the rest", async () => {
    renderTabs("/app/one?month=2026-11&show=email", { keepSearchParams: ["month"] });
    await userEvent.setup().click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByTestId("url")).toHaveTextContent(/^\/app\/two\?month=2026-11$/);
  });

  it("adds nothing when none of the named parameters is present", () => {
    renderTabs("/app/one?bu=API", { keepSearchParams: ["month"] });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("href", "/app/two");
  });
});

describe("an index tab (empty segment)", () => {
  const withIndex: readonly RoutedTabDef[] = [{ segment: "", label: "All" }, ...TABS];

  it("links to the base path itself, and is lit there", () => {
    renderTabs("/app?month=2026-11", { tabs: withIndex, keepSearchParams: ["month"] });
    const all = screen.getByRole("tab", { name: "All" });
    expect(all).toHaveAttribute("href", "/app?month=2026-11");
    expect(all).toHaveAttribute("aria-selected", "true");
  });
});
