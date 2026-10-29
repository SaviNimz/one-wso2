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


// The Marketing Calendar's data, as GET /api/marketing-calendar/items returns it. Each item
// is one GitHub issue under one calendar category: an issue with two calendar
// labels arrives twice, once per category, with a different `id`.

export type CalendarCategory = "event" | "content" | "social" | "email";

export interface CalendarItem {
  // "<owner>/<repo>#<number>:<category>"
  id: string;
  title: string;
  // The issue on github.com.
  url: string;
  category: CalendarCategory;
  // A civil date, YYYY-MM-DD.
  date: string;
  labels: string[];
  state: "open" | "closed";
  // The issue's project fields (Status, Format, Publishing Platform, …) as
  // ready-to-show text, keyed by field name. Which fields exist depends on the
  // GitHub project, so the drawer shows whatever arrives.
  metadata: Record<string, string>;
}

export interface CalendarItemsResponse {
  // When the backend read GitHub, as an ISO-8601 UTC instant.
  fetchedAt: string;
  items: CalendarItem[];
}
