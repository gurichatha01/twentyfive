# 25

A mobile-first birthday invitation for Guri and Lakshit. Saturday 26 September 2026, Dwarka.

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.
Not Next.js, not React. Vercel serves it as a static site with zero config,
because there is no `package.json` for it to try to build.

## The one file you edit

Everything changeable lives in the `CONFIG` object at the top of `app.js`:

| Field | What it is |
| --- | --- |
| `hostA`, `hostB` | The two names in the hero |
| `startISO`, `endISO` | Date and time, ISO 8601 with the `+05:30` offset. Drives the countdown, the ticket stub and the calendar file |
| `venue`, `address` | Shown on the stub, and used to build the Maps link |
| `dress` | The "Wear" line |
| `whatsapp` | **Set this before sending the link.** Country code, no plus, no spaces. `919876543210` |
| `email` | RSVP fallback address |
| `secretPlace` | The payoff for the afterparty easter egg |

Still on placeholders and needing your input:

- `whatsapp` is `919999999999`. RSVPs go nowhere until you change it.
- `venue` / `address` are just "Dwarka, New Delhi". Add the block and sector so the Maps link lands somewhere real.

## Running it locally

```bash
node server.js
```

Then open http://localhost:5173. The server is only for local preview, it is not
used in production and nothing imports it.

## Deploying

Push to GitHub, then on Vercel: New Project, import the repo, framework preset
"Other", no build command, output directory `.`. Vercel's auto-detection gets
this right on its own.

## The five easter eggs

1. Tap the big **25** five times. Rave mode, and the beat switches to the rock pattern. Five more taps turns it off.
2. Press and hold the **cake** in the 11 PM act for about a second. Unlocks the afterparty section.
3. **Shake the phone.** Drops an 808 and kicks the screen. Needs a real device, and on iOS it only arms after you have tapped the beat button once, because that is when the motion permission is requested.
4. Type a band name into the **song request** box. Try `seedhe maut`, `tame impala`, `avenged sevenfold`, or either of your names.
5. Triple tap the **year** in the footer. Lists the other four. On a desktop keyboard the sequence `up up down down b d a y` does the same.

Progress is kept in `localStorage`, so the counter survives a reload.

## The music

The beat is generated live with the Web Audio API. Kick, snare, hats, a distorted
bass line and chord stabs, sequenced in `app.js` under `Beat`. Nothing is
streamed and no audio file is bundled, so there is no copyright issue with
sending this to anyone. Boom bap by default at 88 BPM, and rave mode switches
the pattern and tempo to a rock feel at 152 BPM.

Browsers will not start audio without a tap, so it always begins muted.

## The background

`bg.js` renders a domain-warped, kaleidoscope-folded plasma in WebGL. It reads
scroll position and the kick drum, so the background pulses with the beat. It
renders at 42% of device pixels to stay cheap on a phone, and pauses when the
tab is hidden. If WebGL is unavailable it falls back to an animated CSS gradient.

## Accessibility

Everything animated respects `prefers-reduced-motion`. With that on, the WebGL
background, the blobs, the hue wave, the marquees and the sticky-stack pinning
all switch off and the page becomes a plain, still, readable invitation. Given
how much this page moves, that path matters.

## Files

```
index.html     markup
styles.css     all styling, including the motion layer
app.js         CONFIG, beat engine, countdown, broadcast, easter eggs, RSVP
bg.js          the WebGL background
server.js      local preview only
```
