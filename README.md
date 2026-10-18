# 🎂 Birthday Gift (template)

One birthday surprise per person. Same structure every time; you only change `config.js` and the photos.

## Make a new one for someone
1. Copy this whole folder and rename it (e.g. `gift-for-mira`).
2. Open `config.js` and change: `name`, `passcode`, the texts, and the `boxes` (add, remove or reorder).
3. Replace the pictures in `assets/` (or change the paths in `config.js`).
4. Open `index.html` to test, then send it:
   - zip the folder and send it, or
   - upload the folder to Netlify Drop / GitHub Pages / Cloudflare Pages and share the link.

## Flow
curtain + countdown (optional) → passcode → "I have made something for you" → YES / NO → gift boxes

## Gift types (mix any, 3–8 boxes works best)
| type | what it is | main fields |
|---|---|---|
| `gallery` | clothesline photos | `photos:[{src,caption}]` |
| `cake` | blow candles, make a wish | `candles`, `wish` |
| `letter` | typewriter letter + photo | `photo`, `headline`, `paragraphs[]`, `closing` |
| `quiz` | multiple-choice quiz | `questions:[{q,options[],answer,explain}]`, `results[]` |
| `scratch` | scratch-card prize | `prize`, `note` |
| `reasons` | pull-a-reason jar | `reasons[]` |
| `timeline` | dated story | `items:[{date,title,text}]` |
| `match` | memory card game | `items[]` (emoji or image paths) |
| `coupons` | redeemable coupons | `items:[{title,text}]` |
| `wishes` | notes from several people | `wishes:[{from,text}]` |
| `media` | voice note, song, video | `kind:"audio"/"video"`, `src`, `caption` |
| `message` | simple pop-up note | `icon`, `title`, `text` |

Every box also accepts `label`, `title` and `color`.

## Notes
- Missing images show an emoji instead, so nothing breaks while you're still setting up.
- The passcode is in plain text inside `config.js`: a playful lock, not real security.
- Turn off the opening curtains with `countdown: { enabled: false }`.
- Want several people/events in one site again? Old multi-person configs (`people: { ... }`) still work.
