# Cerno hackathon presentation

## Deliverables

- [`output/Cerno-Hackathon-Presentation.pptx`](output/Cerno-Hackathon-Presentation.pptx) — editable 16:9 PowerPoint deck
- [`PITCH-SCRIPT.md`](PITCH-SCRIPT.md) — timed two-minute demo, one-minute proof, Q&A answers, and slide map
- [`build_deck.py`](build_deck.py) — reproducible deck generator

## Rebuild

From the repository root:

```bash
uv run presentation/build_deck.py
```

The script uses the verified screenshots in `assets/` and the project design tokens. Run claims come from `docs/LIVE-VERIFICATION.md`.

## Judged presentation sequence

For the buildathon’s live format, present slides **1 → 3**, switch to the application for the two-minute demo, return to slide **6** for proof, then finish on slide **7**. Slides **2, 4, and 5** are useful Q&A backups.
