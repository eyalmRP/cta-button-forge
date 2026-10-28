# Team library and team Drive folder: setup

This connects CTA Button Forge to a Google Sheet (the team's saved designs) and a Google Drive folder (exported PNG/SVG files). Anyone with the app's link can then save, load and export to them, with no Google or Claude account needed on their side.

It takes about 5 minutes, done once by the person who will own the Sheet and folder.

## 1. Create the Sheet

1. Go to [sheets.new](https://sheets.new) and name it, for example **CTA Button Forge team library**.
2. In the Sheet: **Extensions → Apps Script**.
3. Delete everything in the editor, paste the whole of [`Code.gs`](Code.gs) from this folder, and press **Save** (the disk icon).

## 2. Deploy it as a web app

1. In Apps Script: **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Press **Deploy**, then **Authorize access** and pick your Google account.
   - Google shows "Google hasn't verified this app" because the script is your own. Choose **Advanced → Go to … (unsafe)** and **Allow**. It only asks for access to this Sheet and to Drive, so it can create the export folder.
5. Copy the **Web app URL** (it ends in `/exec`).

## 3. Connect the app

Send the Web app URL to Claude to build into the app, so everyone is connected automatically.

Or, to try it first: in the app, under **Design gallery**, press **Connect team library…**, paste the URL and press **Connect**. That only connects your own browser.

## 4. Share the export folder

The first time someone presses **Save to team Drive**, a folder called **CTA Button Forge exports** appears in your Drive. Each batch export gets its own subfolder inside it.

To let the team open it from the app's **Open team folder** link: right-click the folder in Drive → **Share** → **General access: Anyone with the link** (Viewer).

## Good to know

- **Who can change things:** anyone with the app's link can add, rename, update and delete team designs. If something is deleted by mistake, restore it from the Sheet: **File → Version history**.
- **Your name:** the first time someone shares a design, the app asks for their name. It's shown on their team designs.
- **Folders:** team designs remember their folder in the Sheet's `folder` column (added automatically). Sheets set up with the first version of the script need the script updated once (below) for team folders to be kept.
- **Updating the script later:** paste the new code, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The URL stays the same.
- **Size limit:** a design with large uploaded images may be too big for a Sheet cell. The app says so; use **Download .json** for those.
