# Lookout SE Web Tools — Admin Feature Flags

A Chrome extension for Lookout Sales Engineers that replaces the raw JSON output of the admin console cache API with a formatted, filterable feature flag table.

---

## What it does

When you navigate to the console cache endpoint (while logged in), the extension automatically renders a UI showing:

- **Tenant summary cards** — name, ID, type, state, permissions, and enabled flag count per tenant
- **Feature flag table** — all flags as rows, tenants as columns, with green `ON` / grey `OFF` badges
- **Search** — filter flags by name in real time
- **Diff only** — show only flags where tenants differ
- **Enabled only** — show only flags that are `ON` for at least one tenant
- **Raw JSON** — modal viewer for the original response

---

## Installation

### Option A — Install from the latest release (recommended)

1. Go to [Releases](../../releases) and download `lookout-admin-feature-flags.zip`
2. Unzip the file to a permanent folder on your machine (e.g. `~/extensions/lookout-admin-feature-flags/`)
3. Open Chrome and navigate to `chrome://extensions`
4. Enable **Developer mode** (toggle in the top-right corner)
5. Click **Load unpacked** and select the unzipped folder
6. The extension icon will appear in your toolbar

### Option B — Load from source

```bash
git clone https://github.com/fgravato/lookout-se-webtools.git
```

Then follow steps 3–6 above, pointing **Load unpacked** at the cloned folder.

---

## Usage

1. Log in to [mtp.lookout.com](https://mtp.lookout.com)
2. Click the **Lookout Feature Flags** extension icon in the toolbar
3. Click **Open Feature Flags** — the extension navigates directly to the cache endpoint and renders the table

> **Note:** You must be logged in first. The extension re-uses your active browser session — no credentials are stored.

---

## Permissions used

| Permission | Reason |
|---|---|
| `tabs` | Read the current tab URL to show connection status in the popup |
| `activeTab` | Navigate the current tab to the feature flags endpoint |
| `scripting` | Inject the formatting UI into the JSON response page |
| `host_permissions: *.lookout.com` | Required to run the content script on the Lookout domain |

---

## Building a new release

```bash
# From the repo root
zip -r lookout-admin-feature-flags.zip \
  manifest.json content.js styles.css popup.html popup.js \
  icons/icon16.png icons/icon48.png icons/icon128.png
```

Then create a new GitHub release and attach the ZIP.

---

## Target endpoint

```
https://mtp.lookout.com/les/api/public/v1/console/cache
```
