# 韓文字母與單字互動學習卡 (Hangul Flashcards)

專為中文與台語學習者設計的韓語字母 40 音教學與高頻單字記憶字卡應用，支援注音符號標音、羅馬拼音、台語諧音推敲法與真人發音。

---

## 🚀 佈署至 GitHub Pages 步驟

本專案已設定好自動化 GitHub Actions 佈署流程，只需以下簡單三步即可免費上線：

### 步驟 1：建立 GitHub 儲存庫並推送程式碼
將專案檔案推送（Push）到您的 GitHub 儲存庫（`main` 或 `master` 分支）：
```bash
git init
git add .
git commit -m "Initial commit for Hangul Flashcards"
git branch -M main
git remote add origin https://github.com/<您的GitHub帳號>/<儲存庫名稱>.git
git push -u origin main
```

### 步驟 2：在 GitHub 啟用 Pages 設定
1. 進入您的 GitHub 專案頁面。
2. 點擊頂部的 **Settings**（設定）。
3. 在左側選單點擊 **Pages**。
4. 在 **Build and deployment** > **Source** 下拉選單中，選擇 **GitHub Actions**。

### 步驟 3：等待自動佈署完成
- GitHub Actions 會自動執行 `.github/workflows/deploy.yml` 進行編譯並佈署。
- 稍等約 1~2 分鐘後，即可在 **Settings > Pages** 看到您的專屬網址：
  `https://<您的GitHub帳號>.github.io/<儲存庫名稱>/`

---

## 💻 本地端開發 (Local Development)

```bash
# 1. 安裝依賴套件
npm install

# 2. 啟動本機開發伺服器
npm run dev

# 3. 編譯靜態網站 (輸出至 dist 資料夾)
npm run build
```

---

## ✨ 功能特色
- 🃏 **40 音字卡互動學習**：基本子音、濃音、基本母音、複合母音。
- 🔊 **真人發音與語速調節**：標準速（0.9x）與慢速（0.7x）。
- 💡 **台語／中文諧音記憶法**：幫助快速建立字音連結。
- 📝 **實戰認字測驗**：單字聽音辨字、字義測驗與組字拆解解析。
- 🧩 **韓文拼字實驗室**：初聲 + 中聲 + 終聲（收音）即時合成發音。
- 📊 **進度統計與弱點加強**：自動記錄學習歷史與正確率。
