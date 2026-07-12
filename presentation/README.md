# Cerno hackathon presentation

## Deliverables

- [`output/Cerno-Hackathon-Presentation.pptx`](output/Cerno-Hackathon-Presentation.pptx) — editable 16:9 PowerPoint deck
- [`PITCH-SCRIPT.md`](PITCH-SCRIPT.md) — timed three-minute product reveal, one-minute Q&A, production receipts, and stage setup
- [`build_deck.py`](build_deck.py) — reproducible deck generator

## Rebuild

From the repository root:

```bash
uv run presentation/build_deck.py
```

The script uses the verified screenshots in `assets/` and the project design tokens. Run claims come from `docs/LIVE-VERIFICATION.md`.

## Judged presentation sequence

For the buildathon’s live format, open on slide **1**, switch directly to the application for the briefing, exact clip, rejection, and run trace, return to slide **6** for production proof, then finish on slide **7**. Slides **2–5** are Q&A backups.
