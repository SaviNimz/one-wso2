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

// Marketing Calendar: a month of the events, content, social posts and emails the
// marketing team plans in GitHub (digiops-marketing#1596).
//
// The month and the category filter live in the URL (`?month=2026-11&category=event`)
// so a view can be shared as a link and survives a reload. The filter runs in the
// browser over one fetch per month, so switching category makes no request.
//
// Freshness: the items are read from GitHub on every visit, month change and
// Refresh, never by themselves while the page is open. "Last updated" says when.

import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@wso2/oxygen-ui";
import { ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from "@wso2/oxygen-ui-icons-react";
import { MARKETING_OPS_EYEBROW } from "@constants/marketingOpsApps";
import ErrorNotice from "@components/error-notice/ErrorNotice";
import MarketingOpsShell from "../../components/MarketingOpsShell";
import { useMarketingOpsGate } from "../../api/useMarketingOpsGate";
import { useMarketingCalendarItems } from "../../api/useMarketingCalendar";
import { CALENDAR_CATEGORIES, parseCategory } from "../calendarCategories";
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
import type { CalendarItem } from "../marketingCalendarTypes";
import CalendarItemDrawer from "../components/CalendarItemDrawer";
import MonthGrid from "../components/MonthGrid";

const GATE_ID = "mops-marketing-calendar";
const ALL_CATEGORIES = "all";

export default function MarketingCalendarPage() {
  return (
    <MarketingOpsShell
      eyebrow={MARKETING_OPS_EYEBROW.marketingCalendar}
      title="Calendar"
      subtitle="Events, content, social posts and emails planned in GitHub. Click an item for its details."
    >
      <CalendarAccessCheck />
    </MarketingOpsShell>
  );
}

// The shell has already settled that the caller may use Marketing Ops at all; this
// checks the Marketing Calendar capability itself, at the route, so a typed or shared
// URL gets an answer rather than a failed request. The calendar (and its query)
// mounts only once that passes.
function CalendarAccessCheck() {
  const gate = useMarketingOpsGate();
  if (!gate.canSee(GATE_ID)) {
    return (
      <Alert severity="info" sx={{ mt: 1.5 }}>
        The Marketing Calendar isn&apos;t available to you. Ask a Marketing Ops admin to add you to
        the Marketing Calendar group.
      </Alert>
    );
  }
  return <MarketingCalendar />;
}

function MarketingCalendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const month = parseIsoMonth(searchParams.get("month")) ?? currentMonth();
  const category = parseCategory(searchParams.get("category"));
  const [openItem, setOpenItem] = useState<CalendarItem | null>(null);

  // The fetch covers every day drawn, including the neighbouring months' days at
  // the start and end of the grid.
  const weeks = monthGridWeeks(month);
  const firstDay = isoDate(weeks[0][0]);
  const lastDay = isoDate(weeks[weeks.length - 1][6]);
  const itemsQuery = useMarketingCalendarItems(firstDay, lastDay);

  const allItems = itemsQuery.data?.items ?? [];
  const shownItems = category ? allItems.filter((item) => item.category === category) : allItems;

  const updateSearchParams = (changes: Record<string, string | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [name, value] of Object.entries(changes)) {
        if (value === null) next.delete(name);
        else next.set(name, value);
      }
      return next;
    });
  };
  const showMonth = (next: CalendarMonth) => updateSearchParams({ month: isoMonth(next) });
  const showCategory = (next: string) =>
    updateSearchParams({ category: next === ALL_CATEGORIES ? null : next });

  return (
    <Box>
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

        <ToggleButtonGroup
          value={category ?? ALL_CATEGORIES}
          exclusive
          size="small"
          aria-label="Category"
          onChange={(_, next: string | null) => {
            if (next) showCategory(next);
          }}
        >
          <ToggleButton value={ALL_CATEGORIES}>All</ToggleButton>
          {CALENDAR_CATEGORIES.map((style) => (
            <ToggleButton key={style.key} value={style.key}>
              {style.pluralLabel}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

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

      {itemsQuery.isSuccess && shownItems.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Nothing planned for {monthTitle(month)}
          {category ? " in this category" : ""}.
        </Typography>
      )}

      <MonthGrid month={month} weeks={weeks} items={shownItems} onOpenItem={setOpenItem} />

      <CalendarItemDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </Box>
  );
}

/** "14:05", in the reader's locale and timezone, for an ISO instant. */
function timeOfDay(instant: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(instant));
}
