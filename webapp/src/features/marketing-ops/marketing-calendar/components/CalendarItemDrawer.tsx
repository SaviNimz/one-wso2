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

import { Box, Button, Chip, Drawer, IconButton, Stack, Typography } from "@wso2/oxygen-ui";
import { ExternalLinkIcon, XIcon } from "@wso2/oxygen-ui-icons-react";
import { categoryStyle } from "../calendarCategories";
import { longDate } from "../calendarDates";
import type { CalendarItem } from "../marketingCalendarTypes";

// One item's details in a drawer on the right, the same shape as Event
// Platform's SpeakerPreviewDrawer. The issue body is not shown: whether it may be
// is still undecided (Q6), so the backend doesn't send it.
export default function CalendarItemDrawer({
  item,
  onClose,
}: {
  // Open while an item is set.
  item: CalendarItem | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      anchor="right"
      open={item !== null}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 400 }, p: 3 } } }}
    >
      {item && <ItemDetails item={item} onClose={onClose} />}
    </Drawer>
  );
}

function ItemDetails({ item, onClose }: { item: CalendarItem; onClose: () => void }) {
  const style = categoryStyle(item.category);
  const metadata = Object.entries(item.metadata);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Chip label={style.label} color={style.color} variant="outlined" size="small" />
        <IconButton size="small" aria-label="Close details" onClick={onClose}>
          <XIcon size={18} />
        </IconButton>
      </Box>

      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {longDate(item.date)} · {item.state === "open" ? "Open" : "Closed"}
      </Typography>

      {metadata.length > 0 && (
        <Box component="dl" sx={{ m: 0, mb: 2 }}>
          {metadata.map(([field, value]) => (
            <Box key={field} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}>
              <Typography component="dt" variant="caption" color="text.secondary">
                {field}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0, overflowWrap: "anywhere" }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {item.labels.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Labels
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
            {item.labels.map((label) => (
              <Chip key={label} label={label} size="small" />
            ))}
          </Stack>
        </Box>
      )}

      {/* Only https links are written into an href — docs/conventions.md. */}
      {isHttpsUrl(item.url) && (
        <Button
          component="a"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          size="small"
          startIcon={<ExternalLinkIcon size={16} />}
        >
          Open in GitHub
        </Button>
      )}
    </>
  );
}

function isHttpsUrl(url: string): boolean {
  return /^https:\/\//i.test(url);
}
