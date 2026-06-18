#!/usr/bin/env python3
"""
Build script for the static "Tierras perdidas, sueños encontrados" timeline viewer.

Reads the LegendKeeper JSON export, extracts + optimizes event images, and emits a
slim `docs/data.js` that the static front-end renders. No third-party Python deps.

Image optimization uses `cwebp` if available (falls back to writing the raw PNG).

Usage:  python3 build.py
"""

import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "Tierras perdidas, sueños encontrados.json")
DOCS = os.path.join(HERE, "docs")
IMG_DIR = os.path.join(DOCS, "images")

# Minutes-per-day in the LegendKeeper time model (24h * 60m). The `start` field
# is stored as minutes since 0001-01-01 of the proleptic Gregorian calendar.
MIN_PER_DAY = 1440.0


# --- Proleptic Gregorian date math (BCE-capable; stdlib datetime can't do year<1) ---
def days_from_civil(y, m, d):
    y -= m <= 2
    era = (y if y >= 0 else y - 399) // 400
    yoe = y - era * 400
    doy = (153 * ((m + 9) % 12) + 2) // 5 + d - 1
    doe = yoe * 365 + yoe // 4 - yoe // 100 + doy
    return era * 146097 + doe - 719468


def civil_from_days(z):
    z += 719468
    era = (z if z >= 0 else z - 146096) // 146097
    doe = z - era * 146097
    yoe = (doe - doe // 1460 + doe // 36524 - doe // 146096) // 365
    y = yoe + era * 400
    doy = doe - (365 * yoe + yoe // 4 - yoe // 100)
    mp = (5 * doy + 2) // 153
    d = doy - (153 * mp + 2) // 5 + 1
    m = mp + 3 if mp < 10 else mp - 9
    return (y + (m <= 2), m, d)


# day number (0 = 0001-01-01) measured in the Hinnant algorithm's epoch (1970-01-01)
BASE = days_from_civil(1, 1, 1)


def date_from_min(mn):
    """Return (year, month, day) for a `start` value in minutes. year<=0 is BCE."""
    daynum = round(mn / MIN_PER_DAY)
    return civil_from_days(BASE + daynum)


def day_number(mn):
    return mn / MIN_PER_DAY


def year_label(year):
    # Astronomical year 0 -> 1 BCE, -1 -> 2 BCE, etc. (no year zero in CE/BCE).
    if year > 0:
        return f"{year} CE"
    return f"{1 - year} BCE"


def age_years(prev, cur):
    """Whole calendar years between two (y,m,d) dates (age-style), matching LK."""
    py, pm, pd = prev
    cy, cm, cd = cur
    years = cy - py
    if (cm, cd) < (pm, pd):
        years -= 1
    return years


def plural(n, unit):
    return f"{n} {unit}" if abs(n) == 1 else f"{n} {unit}s"


def relative_label(prev, cur, prev_min, cur_min):
    """Gap from previous event: 'N years later' if >=1y, else 'N days later'."""
    yrs = age_years(prev, cur)
    if yrs >= 1:
        return plural(yrs, "year") + " later"
    days = round(day_number(cur_min) - day_number(prev_min))
    if days == 0:
        return "same day"
    return plural(days, "day") + " later"


def have_cwebp():
    return shutil.which("cwebp") is not None


def convert_image(data_uri, out_path):
    """Decode a data URI and write an optimized .webp (or raw fallback)."""
    try:
        header, b64 = data_uri.split(",", 1)
    except ValueError:
        return False
    raw = base64.b64decode(b64)
    ext = "png"
    if "jpeg" in header or "jpg" in header:
        ext = "jpg"
    with tempfile.NamedTemporaryFile(suffix="." + ext, delete=False) as tmp:
        tmp.write(raw)
        tmp_path = tmp.name
    try:
        if have_cwebp():
            # cap width at 700px, quality 80 — cards render small
            r = subprocess.run(
                ["cwebp", "-quiet", "-q", "80", "-resize", "700", "0", tmp_path, "-o", out_path],
                capture_output=True,
            )
            if r.returncode == 0 and os.path.exists(out_path):
                return True
        # fallback: write raw bytes with original extension
        raw_out = os.path.splitext(out_path)[0] + "." + ext
        with open(raw_out, "wb") as f:
            f.write(raw)
        return os.path.basename(raw_out)
    finally:
        os.unlink(tmp_path)


def main():
    if not os.path.exists(SRC):
        sys.exit(f"Source JSON not found: {SRC}")

    print("Reading JSON (this is a large file)...")
    with open(SRC, encoding="utf-8") as f:
        data = json.load(f)

    resource = data["resources"][0]
    doc = resource["documents"][0]
    content = doc["content"]
    events = content["events"]
    title = resource.get("name") or doc.get("name") or "Timeline"
    calendar = doc.get("calendarId", "gregorian")
    calendar_name = calendar.capitalize()

    os.makedirs(IMG_DIR, exist_ok=True)
    # clean old images
    for fn in os.listdir(IMG_DIR):
        os.remove(os.path.join(IMG_DIR, fn))

    events = sorted(events, key=lambda e: e["start"])

    if not have_cwebp():
        print("WARNING: cwebp not found — images will be written un-optimized (large).")

    out = []
    prev_date = None
    prev_min = None
    prev_year = None
    n_img = 0
    for e in events:
        mn = e["start"]
        y, mo, d = date_from_min(mn)
        image_file = None
        uri = e.get("imageUrl", "")
        if uri.startswith("data:"):
            base_name = e["id"] + ".webp"
            res = convert_image(uri, os.path.join(IMG_DIR, base_name))
            if res is True:
                image_file = "images/" + base_name
                n_img += 1
            elif isinstance(res, str):
                image_file = "images/" + res
                n_img += 1

        show_year = (prev_year is None) or (y != prev_year)
        rel = ""
        if prev_date is not None:
            rel = relative_label(prev_date, (y, mo, d), prev_min, mn)

        out.append({
            "id": e["id"],
            "name": e["name"],
            "color": e.get("color", "#0079CC"),
            "image": image_file,
            "yearLabel": year_label(y) if show_year else "",
            "rel": rel,
            "dateText": year_label(y),
        })

        prev_date = (y, mo, d)
        prev_min = mn
        prev_year = y

    payload = {
        "title": title,
        "calendar": calendar_name,
        "events": out,
    }

    os.makedirs(DOCS, exist_ok=True)
    data_js = os.path.join(DOCS, "data.js")
    with open(data_js, "w", encoding="utf-8") as f:
        f.write("// Auto-generated by build.py — do not edit by hand.\n")
        f.write("window.TIMELINE_DATA = ")
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"Wrote {data_js}")
    print(f"Events: {len(out)} | images: {n_img}")
    total = sum(os.path.getsize(os.path.join(IMG_DIR, fn)) for fn in os.listdir(IMG_DIR))
    print(f"Image dir size: {total/1024/1024:.1f} MB")
    print("Done.")


if __name__ == "__main__":
    main()
