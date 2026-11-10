# GGU Wallet Registration

A one-page site where students connect their classroom wallet, add their name, and sign a message to prove they own the address. You collect the entries in a Google Sheet and download them as CSV or Excel.

## Files

- `index.html`: the whole website (student form and instructor view).
- `apps-script.gs`: the free Google Sheets backend that stores the entries.

## Setup (about 10 minutes)

### 1. Make the sheet backend
1. Create a new Google Sheet, for example "GGU Wallets".
2. Open **Extensions → Apps Script**, delete the sample code and paste in `apps-script.gs`.
3. Change `ADMIN_KEY` at the top to a password only you know.
4. Click **Deploy → New deployment**, pick the **Web app** type, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Authorize it, then copy the **Web app URL** (it ends in `/exec`).

### 2. Connect the site
Open `index.html` and paste the URL into `SCRIPT_URL` near the bottom:

```js
const CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec",
  ...
};
```

### 3. Put it online (free, pick one)
- **Netlify Drop**: go to app.netlify.com/drop and drag the `ggu-registration` folder in. You get a public link right away.
- **GitHub Pages**: push the folder to a repo, then turn on Pages in the repo settings.
- **Vercel** or **Cloudflare Pages** work the same way.

The site must be served over **https**. Wallets won't connect from a `file://` page.

## Getting the entries
- Open `https://your-site/#admin` (or click **Instructor** in the footer), enter your admin key, then click **Download CSV**. You can also copy every name and address in one click.
- Or open the Google Sheet directly and use **File → Download → .xlsx / .csv**.

Each row has: timestamp, name, wallet address, wallet app, signature and the signed message. If a student registers the same address twice, the row is updated, not duplicated.

## Notes
- Works with any Ethereum-compatible browser wallet (MetaMask, Coinbase Wallet, Rabby, Brave, Trust and others). Signing costs nothing and sends no transaction.
- On phones, students should open the link inside their wallet app's browser. The page shows "Open in MetaMask app" and "Open in Coinbase Wallet" buttons when it can't find a wallet.
- The browser checks each signature against the address before saving. The signature and message are stored, so you can re-check any entry later with any Ethereum signature tool.
- With `SCRIPT_URL` left empty, the page runs in local mode and saves entries only in that browser. That's fine for testing or for one shared classroom laptop.
