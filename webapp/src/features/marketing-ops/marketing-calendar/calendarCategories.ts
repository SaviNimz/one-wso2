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

import type { CalendarCategory } from "./marketingCalendarTypes";

// The four calendar categories in the order the filter offers them, each with the
// theme colour its chips use. Theme palette keys rather than hex values, so the
// chips follow light and dark mode with the rest of the app.

export interface CategoryStyle {
  key: CalendarCategory;
  // The filter's label for the whole category.
  pluralLabel: string;
  // The label on one item.
  label: string;
  color: "primary" | "info" | "success" | "secondary";
}

export const CALENDAR_CATEGORIES: readonly CategoryStyle[] = [
  { key: "event", pluralLabel: "Events", label: "Event", color: "primary" },
  { key: "content", pluralLabel: "Content", label: "Content", color: "info" },
  { key: "social", pluralLabel: "Social", label: "Social", color: "success" },
  { key: "email", pluralLabel: "Email", label: "Email", color: "secondary" },
];

export function categoryStyle(category: CalendarCategory): CategoryStyle {
  return CALENDAR_CATEGORIES.find((style) => style.key === category) ?? CALENDAR_CATEGORIES[0];
}

/** The `?category=` value as a category, or null for "all" and anything unknown. */
export function parseCategory(value: string | null): CalendarCategory | null {
  return CALENDAR_CATEGORIES.find((style) => style.key === value)?.key ?? null;
}
