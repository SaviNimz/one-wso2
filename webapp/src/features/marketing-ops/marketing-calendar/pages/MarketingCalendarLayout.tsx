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

// The frame every calendar tab shares: the tab bar, the toolbar (month, Today,
// Last updated, Refresh), the error notice and the one items query, with an
// <Outlet /> for whichever view the URL names.
//
// The month and the filters live in the URL (`?month=2026-11&bu=Corporate`) so a
// view can be shared as a link and survives a reload. The tabs keep only
// `?month=` across a switch: each tab's filters are its own, so a `?bu=` set on
// Content must not silently filter Events. The filtering runs in the
// browser over one fetch per grid, so switching tab or filter makes no request.
//
// Freshness: the items are read from GitHub on every visit, month change and
// Refresh, never by themselves while the page is open. "Last updated" says when.

import { useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@wso2/oxygen-ui";
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from "@wso2/oxygen-ui-icons-react";
import ErrorNotice from "@components/error-notice/ErrorNotice";
import RoutedTabs from "@components/routed-tabs/RoutedTabs";
import { useMarketingCalendarItems } from "../../api/useMarketingCalendar";
import {
  addMonths,
  currentMonth,
  isoDate,
  isoMonth,
  monthGridWeeks,
  monthTitle,
  parseIsoMonth,
  type CalendarMonth,
} from "../calendarDates";
import { CALENDAR_TABS, MARKETING_CALENDAR_PATH, type CalendarOutletContext } from "../calendarOutlet";
import type { CalendarItem } from "../marketingCalendarTypes";
import CalendarItemDrawer from "../components/CalendarItemDrawer";

// The query parameters every tab shares; the rest belong to the tab that set them.
const KEPT_SEARCH_PARAMS = ["month"] as const;

export default function MarketingCalendarLayout() {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const month = parseIsoMonth(searchParams.get("month")) ?? currentMonth();
  const [openItem, setOpenItem] = useState<CalendarItem | null>(null);

  // The fetch covers every day drawn, including the neighbouring months' days at
  // the start and end of the grid.
  const weeks = monthGridWeeks(month);
  const firstDay = isoDate(weeks[0][0]);
  const lastDay = isoDate(weeks[weeks.length - 1][6]);
  const itemsQuery = useMarketingCalendarItems(firstDay, lastDay);

  const updateSearchParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [name, value] of Object.entries(changes)) {
      if (value === null) next.delete(name);
      else next.set(name, value);
    }
    // The list separator stays a readable comma (`?show=social,email`) rather than
    // %2C: a comma needs no escaping in a query string.
    const search = next.toString().replace(/%2C/gi, ",");
    navigate({ pathname, search: search ? `?${search}` : "" });
  };
  const showMonth = (next: CalendarMonth) => updateSearchParams({ month: isoMonth(next) });

  const outlet: CalendarOutletContext = {
    month,
    weeks,
    items: itemsQuery.data?.items ?? [],
    loaded: itemsQuery.isSuccess,
    updateSearchParams,
    openItem: setOpenItem,
  };

  return (
    <Box>
      <RoutedTabs
        basePath={MARKETING_CALENDAR_PATH}
        tabs={CALENDAR_TABS}
        ariaLabel="Calendar views"
        keepSearchParams={KEPT_SEARCH_PARAMS}
      />

      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <IconButton size="small" aria-label="Previous month" onClick={() => showMonth(addMonths(month, -1))}>
            <ChevronLeftIcon size={18} />
          </IconButton>
          <IconButton size="small" aria-label="Next month" onClick={() => showMonth(addMonths(month, 1))}>
            <ChevronRightIcon size={18} />
          </IconButton>
          <Typography variant="h6" component="h2" sx={{ minWidth: 170, ml: 0.5 }}>
            {monthTitle(month)}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => showMonth(currentMonth())}>
            Today
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: "auto" }}>
          {itemsQuery.data && (
            <Typography variant="caption" color="text.secondary">
              Last updated {timeOfDay(itemsQuery.data.fetchedAt)}
            </Typography>
          )}
          <Tooltip title="Read the latest from GitHub">
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={
                  itemsQuery.isFetching ? <CircularProgress size={14} /> : <RefreshCwIcon size={16} />
                }
                disabled={itemsQuery.isFetching}
                onClick={() => void itemsQuery.refetch()}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* A failed refresh keeps whatever is already on screen, below the notice. */}
      {itemsQuery.isError && (
        <ErrorNotice
          error={itemsQuery.error}
          onRetry={() => void itemsQuery.refetch()}
          retrying={itemsQuery.isFetching}
          sx={{ mb: 2 }}
        >
          Couldn&apos;t load the calendar from GitHub.
        </ErrorNotice>
      )}

      <Outlet context={outlet} />

      <CalendarItemDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </Box>
  );
}

/** "14:05", in the reader's locale and timezone, for an ISO instant. */
function timeOfDay(instant: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(instant));
}
