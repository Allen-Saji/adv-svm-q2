# Advanced SVM Q2 2026

Notes, artifacts, and deep dives from the **Turbin3 Q2 2026 Advanced SVM Cohort**.

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

## Author

Allen Saji ([@SajiBhai011](https://x.com/SajiBhai011)) -- [allensaji.dev](https://allensaji.dev)
