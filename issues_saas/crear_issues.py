#!/usr/bin/env python3
"""
Crea y cierra (como completed) los issues de documentación de la rama saas
en francisco-J-perez-M/SistemaGYM, leyendo issues_saas.md como fuente de verdad.

Requisitos:
  - GitHub CLI autenticado: `gh auth status`
  - Para agregar al project (opcional): `gh auth refresh -s project`

Uso:
  python crear_issues.py                    # crea + cierra los 28 issues
  python crear_issues.py --dry-run          # solo muestra lo que haría
  python crear_issues.py --project 1        # además los agrega al project #1
  python crear_issues.py --project 1 --project-owner francisco-J-perez-M
"""
import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = "francisco-J-perez-M/SistemaGYM"
MD = Path(__file__).parent / "issues_saas.md"

LABEL_COLORS = {
    "saas": "0e8a16", "web": "1d76db", "mobile": "5319e7", "backend": "b60205",
    "devops": "006b75", "docs": "0075ca", "ia-analiticas": "d93f0b",
    "feature": "a2eeef", "fix": "d73a4a", "refactor": "cfd3d7", "security": "ee0701",
}


def run(cmd, dry=False, capture=True):
    print("  $", " ".join(cmd))
    if dry:
        return ""
    r = subprocess.run(cmd, capture_output=capture, text=True, encoding="utf-8")
    if r.returncode != 0:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(f"Fallo: {' '.join(cmd)}")
    return (r.stdout or "").strip()


def parse_md():
    text = MD.read_text(encoding="utf-8")
    # Labels desde la tabla resumen: | 1 | Título | l1, l2 |
    labels_by_num = {}
    for m in re.finditer(r"^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([\w\-, ]+?)\s*\|$", text, re.M):
        labels_by_num[int(m.group(1))] = [l.strip() for l in m.group(3).split(",")]
    # Secciones: ## N. Título ... (hasta la siguiente ## o EOF)
    issues = []
    for m in re.finditer(r"^## (\d+)\. (.+?)\n(.*?)(?=^## \d+\. |\Z)", text, re.M | re.S):
        num, title, body = int(m.group(1)), m.group(2).strip(), m.group(3).strip()
        body += "\n\n---\n_Issue de documentación de actividades realizadas en la rama `saas`._"
        issues.append({"num": num, "title": title, "body": body,
                       "labels": labels_by_num.get(num, ["saas"])})
    return issues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--project", help="Número del project v2 (ej. 1)")
    ap.add_argument("--project-owner", default="francisco-J-perez-M")
    a = ap.parse_args()

    issues = parse_md()
    print(f"{len(issues)} issues parseados de {MD.name}\n")

    print("Creando labels...")
    for name, color in LABEL_COLORS.items():
        run(["gh", "label", "create", name, "-R", REPO, "--color", color, "--force"], a.dry_run)

    for it in issues:
        print(f"\n[{it['num']}/{len(issues)}] {it['title']}")
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write(it["body"])
            body_file = f.name
        url = run(["gh", "issue", "create", "-R", REPO, "--title", it["title"],
                   "--label", ",".join(it["labels"]), "--body-file", body_file], a.dry_run)
        if a.dry_run:
            continue
        print("  Creado:", url)
        run(["gh", "issue", "close", url, "-R", REPO, "--reason", "completed"])
        if a.project:
            run(["gh", "project", "item-add", a.project,
                 "--owner", a.project_owner, "--url", url])

    print("\nListo. Verifica en: https://github.com/" + REPO + "/issues?q=label%3Asaas")


if __name__ == "__main__":
    main()
