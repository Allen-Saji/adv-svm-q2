# Advanced SVM Q2 2026

Notes, artifacts, and deep dives from the **Turbin3 Q2 2026 Advanced SVM Cohort**.

Live site: https://allen-saji.github.io/adv-svm-q2/

## What is this?

A 6-week intensive program covering Solana Virtual Machine internals -- Alpenglow, Constellation, Agave validator architecture, and low-level systems programming for the Solana runtime. The cohort trains protocol engineers who can contribute to Solana's core infrastructure (Agave, Firedancer, Anza).

## Structure

Each topic gets its own folder with interactive HTML artifacts that break down the material into visual, story-driven explanations.

### linux-networking-agave/

**Linux Networking for Agave Validators** -- what happens before a packet reaches the Agave validator code.

A 7-part deep dive covering:

| Part | File | Topic |
|------|------|-------|
| 1 | `part1-why-udp.html` | Why Solana chose UDP over TCP |
| 2 | `part2-packet-journey.html` | The 15-step Linux UDP receive path |
| 3 | `part3-why-it-breaks.html` | Six cost centers that break at validator scale |
| 4 | `part4-ebpf.html` | eBPF -- safe programmable code inside the kernel |
| 5 | `part5-xdp.html` | XDP -- the early hook at the NIC driver |
| 6 | `part6-af-xdp.html` | AF_XDP -- zero-copy kernel bypass rings |
| 7 | `part7-big-picture.html` | Classic vs XDP vs AF_XDP, Agave code pointers, Firedancer |

Open any `.html` file in a browser -- they are self-contained with no build step.

### block-building/

**Block Building on Solana** -- how a Solana block actually gets constructed, where MEV infrastructure plugs into the validator pipeline, and where the protocol roadmap (Alpenglow, APE, Constellation) takes all of it.

| Part | File | Topic |
|------|------|-------|
| 1 | `part1-architecture-walkthrough.html` | End-to-end Solana architecture, from user tx to rooted finality (77-step walkthrough with inline visuals) |
| 2 | `part2-harmonic-lecture-prep.html` | Open block building -- Jito stack, MEV taxonomy, Harmonic's multi-builder marketplace, Alpenglow/APE/Constellation implications, and a set of open questions for Harmonic |

## Site

The landing page at [allen-saji.github.io/adv-svm-q2](https://allen-saji.github.io/adv-svm-q2/)
is generated from the note files themselves by a zero-dependency Node script
(`site/build.mjs`) and deployed to GitHub Pages on every push to `main`.

### Adding a note

1. Drop a self-contained `partN-name.html` into a topic folder (or create a new
   topic folder for a new subject). Give it a `<title>` and a
   `<meta name="description" content="...">`. That is enough metadata.
2. Optional: override the auto-derived fields with
   `<meta name="note-title">`, `<meta name="note-order">`, or
   `<meta name="note-category">` in the `<head>`.
3. Optional: generate a preview thumbnail with `npm run shots` (needs a local
   Chromium-based browser; thumbnails are auto-compressed via sharp). Without
   one, the card uses a generated poster.
4. Run `node site/build.mjs`, commit, and push. The index and the deploy update
   automatically.

The deployed site is pure static HTML/CSS/PNG with no runtime dependencies. The
only build-time tool is Playwright, used solely by the local `shots` step.

### Commands

| Command | What it does |
|---------|--------------|
| `node site/build.mjs` | Regenerate `index.html` from the note files |
| `npm run shots` | Screenshot each note into `site/thumbs/` (local only) |
| `npm run site` | Run `shots` then `build` |

## Author

Allen Saji ([@SajiBhai011](https://x.com/SajiBhai011)) -- [allensaji.dev](https://allensaji.dev)
