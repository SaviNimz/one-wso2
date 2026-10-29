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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_RESPONSE } from "../testing/fixtures";

// The data hook is stubbed with a factory, so the real one (and the runtime
// config it reads at load) is never evaluated. It records the range each render
// asks for, which is how "one fetch per grid" is checked.
const itemsHook = vi.fn<(from: string, to: string) => unknown>(() => ({
  data: SAMPLE_RESPONSE,
  isSuccess: true,
  isError: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
}));
vi.mock("../../api/useMarketingCalendar", () => ({
  useMarketingCalendarItems: (from: string, to: string) => itemsHook(from, to),
}));

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { MARKETING_CALENDAR_PATH } from "../calendarOutlet";
import { marketingCalendarViewRoutes } from "../routes";
import MarketingCalendarLayout from "./MarketingCalendarLayout";

function UrlProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="url">{pathname + search}</div>;
}

function renderCalendar(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={MARKETING_CALENDAR_PATH} element={<MarketingCalendarLayout />}>
          {marketingCalendarViewRoutes}
        </Route>
      </Routes>
      <UrlProbe />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const url = () => screen.getByTestId("url").textContent;
const onGrid = (title: string) => within(screen.getByRole("grid", { name: "Month" })).queryByText(title);

const SOCIAL_POST = "[Social] Facebook: Solutions team in Nairobi";
const EMAIL = "[Email] Year-end customer thank you";
const WHITEPAPER = "[Whitepaper] Securing agent-to-API traffic";
const BLOG = "[Blog] Integrator 5.1 launch recap";

beforeEach(() => {
  itemsHook.mockClear();
});

describe("tabs", () => {
  it("offers All and one tab per category, All lit at the calendar's own path", () => {
    renderCalendar(`${MARKETING_CALENDAR_PATH}?month=2026-11`);
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs).toEqual(["All", "Events", "Content", "Social", "Email"]);
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps the month across a tab switch, and asks for the same range", async () => {
    const user = renderCalendar(`${MARKETING_CALENDAR_PATH}?month=2026-11`);
    await user.click(screen.getByRole("tab", { name: "Social" }));
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}/social?month=2026-11`);
    expect(screen.getByRole("heading", { name: "November 2026" })).toBeVisible();
    expect(onGrid(SOCIAL_POST)).not.toBeNull();
    expect(onGrid(EMAIL)).toBeNull();

    const ranges = new Set(itemsHook.mock.calls.map(([from, to]) => `${from}..${to}`));
    expect(ranges).toEqual(new Set(["2026-10-26..2026-12-06"]));
  });

  it("links every tab with the month only, dropping the other parameters", () => {
    renderCalendar(`${MARKETING_CALENDAR_PATH}/content?month=2026-11&format=Blog&bu=API&show=email`);
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("href", `${MARKETING_CALENDAR_PATH}?month=2026-11`);
    expect(screen.getByRole("tab", { name: "Events" })).toHaveAttribute(
      "href",
      `${MARKETING_CALENDAR_PATH}/events?month=2026-11`,
    );
  });

  it("does not carry a filter set on Content into Events", async () => {
    const user = renderCalendar(`${MARKETING_CALENDAR_PATH}/content?month=2026-11`);
    // Content type, Format, Target persona, BU.
    await user.click(screen.getAllByRole("combobox")[3]);
    await user.click(screen.getByRole("option", { name: "Corporate" }));
    await user.keyboard("{Escape}");
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}/content?month=2026-11&bu=Corporate`);

    await user.click(screen.getByRole("tab", { name: "Events" }));
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}/events?month=2026-11`);
    expect(screen.queryByRole("button", { name: /Clear filters/ })).toBeNull();
  });
});

describe("the retired ?category=", () => {
  it("redirects to the matching tab, keeping the month", () => {
    renderCalendar(`${MARKETING_CALENDAR_PATH}?month=2026-11&category=event`);
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}/events?month=2026-11`);
    expect(screen.getByRole("tab", { name: "Events" })).toHaveAttribute("aria-selected", "true");
  });

  it("drops an unknown or `all` value and stays on All", () => {
    renderCalendar(`${MARKETING_CALENDAR_PATH}?category=all&month=2026-11`);
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}?month=2026-11`);
  });
});

describe("the All view's legend (?show=)", () => {
  it("reads the categories from the URL", () => {
    renderCalendar(`${MARKETING_CALENDAR_PATH}?month=2026-11&show=email`);
    expect(screen.getByRole("button", { name: "Email" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Social" })).toHaveAttribute("aria-pressed", "false");
    expect(onGrid(EMAIL)).not.toBeNull();
    expect(onGrid(SOCIAL_POST)).toBeNull();
  });

  it("writes a toggle back to the URL, and drops ?show= once all four are on", async () => {
    const user = renderCalendar(`${MARKETING_CALENDAR_PATH}?month=2026-11`);
    await user.click(screen.getByRole("button", { name: "Events" }));
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}?month=2026-11&show=content,social,email`);
    await user.click(screen.getByRole("button", { name: "Events" }));
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}?month=2026-11`);
  });

  it("keeps the last category on", async () => {
    const user = renderCalendar(`${MARKETING_CALENDAR_PATH}?month=2026-11&show=email`);
    await user.click(screen.getByRole("button", { name: "Email" }));
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}?month=2026-11&show=email`);
    expect(screen.getByRole("button", { name: "Email" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("a type tab's filters", () => {
  it("reads its filters from the URL and offers Clear filters", () => {
    renderCalendar(`${MARKETING_CALENDAR_PATH}/content?month=2026-11&format=Whitepaper`);
    expect(onGrid(WHITEPAPER)).not.toBeNull();
    expect(onGrid(BLOG)).toBeNull();
    expect(screen.getByRole("button", { name: "Clear filters (1)" })).toBeVisible();
  });

  it("writes a selection to the URL", async () => {
    const user = renderCalendar(`${MARKETING_CALENDAR_PATH}/content?month=2026-11`);
    expect(screen.queryByRole("button", { name: /Clear filters/ })).toBeNull();
    // Content type, Format, Target persona, BU.
    await user.click(screen.getAllByRole("combobox")[1]);
    await user.click(screen.getByRole("option", { name: "Blog" }));
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}/content?month=2026-11&format=Blog`);
    // A multi-select stays open, and hides the page from the a11y tree while it is.
    await user.keyboard("{Escape}");
    expect(onGrid(BLOG)).not.toBeNull();
    expect(onGrid(WHITEPAPER)).toBeNull();
  });

  it("clears only its own filters, keeping the month", async () => {
    const user = renderCalendar(`${MARKETING_CALENDAR_PATH}/content?month=2026-11&format=Blog&bu=Integration`);
    await user.click(screen.getByRole("button", { name: "Clear filters (2)" }));
    expect(url()).toBe(`${MARKETING_CALENDAR_PATH}/content?month=2026-11`);
  });

  it("names the view and the filters when nothing matches", () => {
    renderCalendar(`${MARKETING_CALENDAR_PATH}/content?month=2026-11&format=Blog&bu=API`);
    expect(screen.getByText("No content planned for November 2026 with these filters.")).toBeVisible();
  });
});
