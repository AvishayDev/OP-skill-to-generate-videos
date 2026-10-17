#!/usr/bin/env python3
"""
strip_long_dashes.py - רשת ביטחון דטרמיניסטית למקפים ארוכים, עבור הסקיל ben-adam.

המנוע אמור להחליף מקפים ארוכים בזמן השכתוב, בבחירה חכמה לפי הקשר (פסיק / נקודה /
סוגריים). הסקריפט הזה הוא הקו האחרון: הוא מבטיח שאף מקף ארוך לא ישרוד בפלט, גם אם
המודל פספס אחד. הוא נוגע אך ורק במקפים ה"ארוכים" (— em, – en, ו---- double hyphen
כשהם משמשים כקו מפריד), ולעולם לא במקף רגיל (-) שמשמש בתוך מילים, בנקודות תבליט,
או כתחליף המועדף של בעל הסקיל.

שימוש:
  # החזרת טקסט נקי ל-stdout (קלט מקובץ או מ-stdin):
  python strip_long_dashes.py input.txt
  echo "טקסט — עם מקף" | python strip_long_dashes.py

  # בדיקה בלבד (לא משנה כלום): מדפיס כמה נמצאו, יוצא בקוד 1 אם נמצא ולו אחד:
  python strip_long_dashes.py --check input.txt

  # תיקון במקום, בתוך הקובץ עצמו:
  python strip_long_dashes.py --in-place input.txt

הדוח (כמה הוסרו ואיפה) נכתב ל-stderr כדי לא ללכלך את הפלט הנקי.
"""

import argparse
import re
import sys

# התווים שנחשבים "מקף ארוך" לצורך הכלל. מקף רגיל (-, U+002D) לא ברשימה בכוונה.
EM = "\u2014"   # — em dash
EN = "\u2013"   # – en dash
DOUBLE = "--"   # תחליף נפוץ של מקף ארוך

LONG_DASH_CHARS = EM + EN  # לסריקה/ספירה


def _count(text: str) -> int:
    n = text.count(EM) + text.count(EN)
    # double-hyphen כקו מפריד: נספור רק רצפים של בדיוק שני מקפים שאינם חלק ממילה ארוכה
    n += len(re.findall(r"(?<!-)--(?!-)", text))
    return n


def strip_long_dashes(text: str):
    """מחזיר (טקסט_נקי, כמה_הוסרו)."""
    before = _count(text)

    # 1) טווחי מספרים: מקף ארוך בין שתי ספרות הופך למקף רגיל (2024–2025 -> 2024-2025)
    text = re.sub(r"(?<=\d)\s*[" + EM + EN + r"]\s*(?=\d)", "-", text)
    text = re.sub(r"(?<=\d)--(?=\d)", "-", text)

    # 2) מקף ארוך (em/en) ככל קו מפריד אחר: הופך לפסיק עם רווח אחריו.
    #    זו ברירת מחדל בטוחה. ההחלפה החכמה (נקודה/סוגריים) נעשית כבר ע"י המנוע בשכתוב;
    #    הסקריפט רק מנקה שאריות.
    text = re.sub(r"\s*[" + EM + EN + r"]\s*", ", ", text)

    # 3) double-hyphen כקו מפריד (בדיוק שניים, לא חלק ממילה): הופך לפסיק.
    text = re.sub(r"\s*(?<!-)--(?!-)\s*", ", ", text)

    # 4) ניקוי: פסיקים כפולים, רווח לפני פסיק/נקודה, רווחים כפולים.
    text = re.sub(r",\s*,", ",", text)
    text = re.sub(r"\s+,", ",", text)
    text = re.sub(r",(?=\S)", ", ", text)        # לוודא רווח אחרי פסיק
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+\.", ".", text)
    text = re.sub(r"^,\s*", "", text, flags=re.MULTILINE)  # פסיק בתחילת שורה

    after = _count(text)
    removed = before - after
    return text, removed


def main():
    p = argparse.ArgumentParser(description="רשת ביטחון למקפים ארוכים עבור ben-adam.")
    p.add_argument("path", nargs="?", help="קובץ קלט. אם חסר, קורא מ-stdin.")
    p.add_argument("--check", action="store_true",
                   help="בדיקה בלבד: מדפיס כמה מקפים ארוכים נמצאו, יוצא 1 אם נמצא לפחות אחד.")
    p.add_argument("--in-place", action="store_true",
                   help="לכתוב את התוצאה הנקייה חזרה לקובץ הקלט.")
    args = p.parse_args()

    if args.path:
        with open(args.path, encoding="utf-8") as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    if args.check:
        n = _count(text)
        print(f"long dashes found: {n}", file=sys.stderr)
        sys.exit(1 if n > 0 else 0)

    cleaned, removed = strip_long_dashes(text)
    print(f"long dashes removed: {removed}", file=sys.stderr)

    if args.in_place:
        if not args.path:
            print("--in-place requires a file path", file=sys.stderr)
            sys.exit(2)
        with open(args.path, "w", encoding="utf-8") as f:
            f.write(cleaned)
    else:
        sys.stdout.write(cleaned)


if __name__ == "__main__":
    main()
