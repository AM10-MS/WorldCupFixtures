# World Cup 2026 Singapore TV Board

Static TV-board website for the FIFA World Cup 2026 Singapore-time schedule.

Views:
- Board: rotating overview with the next match and free-to-air highlights.
- Free 28: Mediacorp / Channel 5 / mewatch free-to-air schedule.
- All 104: full Singapore-time poster.
- Next Up: upcoming match cards in Singapore Time.

Run locally:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

Useful TV URLs:

```text
/?slide=board
/?slide=free
/?slide=poster
/?slide=upcoming
/?slide=free&autorotate=0
```

Vercel:
- Import this folder as a static project, or run `vercel` from this directory.
- No build command is required.
- Output directory can be left blank / root.

Sources:
- FIFA official match schedule PDF, updated 10 Apr 2026.
- CNA article updated 8 Jun 2026 on Mediacorp's 28 free-to-air matches.
- Time Out Singapore guide published 9 Jun 2026.
