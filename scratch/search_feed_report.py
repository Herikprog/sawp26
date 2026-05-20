import os

def search_files(directory, term):
    results = []
    for root, dirs, files in os.walk(directory):
        if "node_modules" in root or ".next" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx", ".sql")):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            if term.lower() in line.lower():
                                results.append(f"{path}:{line_num}: {line.strip()}")
                except Exception:
                    pass
    return results

print("=== Search for reports/denunciar in feed or posts ===")
all_results = search_files(".", "denunciar") + search_files(".", "report")
for r in all_results:
    if "feed" in r or "post" in r or "comment" in r:
        print(r.encode('ascii', errors='replace').decode('ascii'))
