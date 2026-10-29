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

import { Chip, Tooltip } from "@wso2/oxygen-ui";
import { categoryChipColor, categoryStyle } from "../calendarCategories";
import { longDate } from "../calendarDates";
import type { CalendarItem } from "../marketingCalendarTypes";

// One item in a day cell. The title is cut to the cell's width, so the tooltip
// carries the whole of it, with the date under the category's own name for it
// (Publish Date, Post Date, …; plain "Date" for an event, whose calendar date is
// its Due Date rather than its start date). Outlined rather
// than filled for the same contrast reason MarketingOpsShell gives for its
// eyebrow chip. A closed item is faded so what is still to come stands out.
export default function CalendarItemChip({
  item,
  onOpen,
}: {
  item: CalendarItem;
  onOpen: (item: CalendarItem) => void;
}) {
  const style = categoryStyle(item.category);
  const paint = categoryChipColor(style, "outlined");
  return (
    <Tooltip
      title={
        <>
          {style.label}: {item.title}
          <br />
          {style.dateLabel}: {longDate(item.date)}
        </>
      }
      placement="top"
      disableInteractive
    >
      <Chip
        label={item.title}
        color={paint.color}
        variant="outlined"
        size="small"
        onClick={() => onOpen(item)}
        sx={{
          ...paint.sx,
          width: "100%",
          justifyContent: "flex-start",
          opacity: item.state === "closed" ? 0.6 : 1,
          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
        }}
      />
    </Tooltip>
  );
}
