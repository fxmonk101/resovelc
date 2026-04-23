

## Phone Number Field Redesign — Sign Up Step 2

Restructure the phone input on the registration page so the country code selector and the local number field stack vertically, look polished on all screen sizes, and treat US and Canada as distinct entries.

### Changes

**1. Split US and Canada in `DIAL_CODES`** (`src/routes/register.tsx`)
- Replace the combined `{ code: "+1", country: "United States / Canada", flag: "🇺🇸" }` with two entries:
  - `{ code: "+1", country: "United States", flag: "🇺🇸" }`
  - `{ code: "+1", country: "Canada", flag: "🇨🇦" }`
- Both share dial code `+1` but show different flags/labels in the dropdown so users can pick their actual country.

**2. Stack the layout vertically** (`Step2` component)
- Replace the current `<div className="flex gap-2">` wrapper with a vertical stack (`space-y-2`).
- Top row: full-width country code `<select>` showing flag + country name + dial code (e.g. `🇺🇸 United States (+1)`), so the long labels are no longer cramped.
- Bottom row: full-width number `<input>` with placeholder `2132469750`.
- Both controls become full-width (`w-full`), eliminating the overflow/cramping at small viewports (the user is on 850px wide).

**3. Polish the visual presentation**
- Add a small helper label above the selector: "Country code".
- Keep the live preview line `Final format: +12132469750` underneath the number field so users see the resulting E.164 string.
- Ensure the selector uses the same `inputCls` styling (white bg, navy-deep text) for consistency with the visibility fix already in place.

**4. Preserve existing behavior**
- `updatePhone()` logic, hidden `phone` register field, validation, and the `+1` dial code default remain unchanged.
- Initial-load matching logic still works because both new US/Canada entries share `+1` (the first match wins on prefix, which is acceptable since only the dial code is persisted).

### Files Edited
- `src/routes/register.tsx`

### Result
A clean, mobile-friendly stacked layout: country selector on top (full width, readable labels), number input directly underneath (full width, large tap target), with US and Canada selectable independently.

