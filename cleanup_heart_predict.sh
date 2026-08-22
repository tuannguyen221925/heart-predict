#!/bin/bash
# ============================================================
# Script dọn dẹp repo heart-predict trước khi cho HR xem
# Chạy trong thư mục gốc của repo (nơi có README.md, package.json)
# ============================================================
set -e

echo "== BƯỚC 1: Xoá file rác / trùng lặp =="
git rm --cached -f "api.rar" "app.rar" "components.rar" 2>/dev/null || true
rm -f "api.rar" "app.rar" "components.rar"

git rm --cached -f "DEV_NOTE.txt" "get add.txt" "my_extensions.txt" "tsconfig.tsbuildinfo" 2>/dev/null || true
rm -f "DEV_NOTE.txt" "get add.txt" "my_extensions.txt" "tsconfig.tsbuildinfo"

git rm --cached -f "api/app/routers/chatbot-backup.py" 2>/dev/null || true
rm -f "api/app/routers/chatbot-backup.py"

echo "== BƯỚC 2: Gộp FIXES_APPLIED.md vào docs/ (giữ lại nhưng gọn hơn) =="
mkdir -p docs
[ -f FIXES_APPLIED.md ] && git mv FIXES_APPLIED.md docs/FIXES_APPLIED.md 2>/dev/null || true

echo "== BƯỚC 3: XOÁ kaggle.json khỏi TOÀN BỘ lịch sử git (quan trọng, key đã bị lộ) =="
echo "   -> Cần cài git-filter-repo: pip install git-filter-repo"
if command -v git-filter-repo >/dev/null 2>&1; then
  git filter-repo --path kaggle/kaggle.json --invert-paths --force
  echo "   Đã xoá kaggle.json khỏi lịch sử. NHỚ: vẫn phải revoke key cũ trên Kaggle."
else
  echo "   !! Chưa có git-filter-repo. Cài bằng: pip install git-filter-repo"
  echo "   Sau đó chạy lại: git filter-repo --path kaggle/kaggle.json --invert-paths --force"
fi
rm -f kaggle/kaggle.json

echo "== BƯỚC 4: Thêm .env.example thay vì commit config thật =="
cat > .env.example << 'EOF'
# ---- Frontend (Next.js) ----
NEXT_PUBLIC_API_LOCAL_URL=http://127.0.0.1:8000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
JWT_SECRET=

# ---- Backend (FastAPI) ----
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
MODEL_DIR=./models
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EOF

echo "== BƯỚC 5: Cập nhật .gitignore =="
cat >> .gitignore << 'EOF'
docs/FIXES_APPLIED.md.bak
*.rar
tsconfig.tsbuildinfo
EOF

echo ""
echo "Xong bước dọn local. Kiểm tra lại bằng: git status"
echo "Sau khi hài lòng: git add -A && git commit -m 'chore: clean up repo for review'"
echo "Vì đã rewrite history (bước 3), khi push cần: git push --force-with-lease origin clean-main"