import json
import re
from pathlib import Path

import openpyxl


SOURCE = Path("/Users/han/Desktop/阅读理解技巧（部编补充版本）.xlsx")
OUTPUT = Path(__file__).resolve().parents[1] / "data.js"


def text(value):
    if value is None:
        return ""
    return str(value).strip()


def split_title(raw_title):
    match = re.match(r"^(\d+)[.．]\s*(.+)$", raw_title)
    if not match:
        return {"number": None, "title": raw_title}
    return {"number": int(match.group(1)), "title": match.group(2).strip()}


def read_main_sheet(workbook):
    sheet = workbook["完整版（可教学）"]
    categories = []
    category_lookup = {}
    items = []
    current_category = ""

    for row in sheet.iter_rows(min_row=3, values_only=True):
        category = text(row[0])
        core = text(row[1])
        question = text(row[2])
        method = text(row[3])
        template = text(row[4])

        if category:
            current_category = category
            if category not in category_lookup:
                category_lookup[category] = {"name": category, "count": 0}
                categories.append(category_lookup[category])

        if not core:
            continue

        title = split_title(core)
        category_lookup[current_category]["count"] += 1
        items.append(
            {
                "id": f"tip-{len(items) + 1}",
                "category": current_category,
                "number": title["number"],
                "title": title["title"],
                "rawTitle": core,
                "question": question,
                "method": method,
                "template": template,
            }
        )

    return categories, items


def main():
    workbook = openpyxl.load_workbook(SOURCE, data_only=True)
    categories, items = read_main_sheet(workbook)
    payload = {
        "source": SOURCE.name,
        "title": "小学语文阅读理解技巧完整版",
        "subtitle": "部编补充版本 / 苏教版常考内容补充",
        "stats": {
            "categoryCount": len(categories),
            "itemCount": len(items),
        },
        "categories": categories,
        "items": items,
    }
    OUTPUT.write_text(
        "window.READING_DATA = "
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(OUTPUT),
                "categories": len(categories),
                "items": len(items),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
