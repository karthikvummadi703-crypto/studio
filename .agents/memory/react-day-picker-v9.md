---
name: react-day-picker v9
description: API differences in react-day-picker v9 vs v8 that affect the Calendar component.
---

## Rule
The project uses react-day-picker **v9**. The Calendar component must use the v9 API.

**Key v8 → v9 changes:**
- `components.IconLeft` / `components.IconRight` → single `components.Chevron` with `orientation` prop (`"left"` | `"right"`)
- `classNames.caption` → `classNames.month_caption`
- `classNames.nav_button` → `classNames.button_previous` / `classNames.button_next`
- `classNames.nav_button_previous` / `classNames.nav_button_next` → merged into `button_previous` / `button_next` above
- `classNames.table` → `classNames.month_grid`
- `classNames.head_row` → `classNames.weekdays`
- `classNames.head_cell` → `classNames.weekday`
- `classNames.row` → `classNames.week`
- `classNames.day` (the cell wrapper) → `classNames.day`; the button inside → `classNames.day_button`
- `classNames.day_selected` → `classNames.selected`
- `classNames.day_today` → `classNames.today`
- `classNames.day_outside` → `classNames.outside`
- `classNames.day_disabled` → `classNames.disabled`
- `classNames.day_range_end` → `classNames.range_end`
- `classNames.day_range_middle` → `classNames.range_middle`
- `classNames.day_hidden` → `classNames.hidden`
