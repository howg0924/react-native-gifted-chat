# react-native-gifted-chat（fork）

上游 `FaridSafi/react-native-gifted-chat`（聊天室 UI 元件，package 版本 0.4.3）的 fork，工作分支 **`modified-for-flatlist`**。

## ⚠️ 這是公開 repo
任何人都看得到本 repo 的檔案、commit 訊息與歷史。寫進這裡的一切（程式、文件、commit 訊息、PR／issue 文字）都要能公開：
- 只寫套件本身的功能、與上游的差異、套件自己遇到的問題與修法。
- **不要寫**：哪些專案、App 或服務在使用本套件（含其名稱、目錄、檔名、函式）、使用端釘住的版本 hash、測試機或環境的實測資料、票號與內部的問題編號、內部文件或工作區的路徑、帳號與主機名稱。commit 訊息也一樣，不要加內部票號前綴。
- 使用端專屬的細節（怎麼升 pin、在哪驗證、哪個畫面用到、待確認事項）寫在**使用端專案自己的文件**，不要寫在這裡。
- 不確定某段資訊適不適合公開，就不要寫，先問使用者。push 前再看一遍即將推出的 diff 與 commit 訊息。

## 與上游的差異
- 基底是上游的 `modified-for-flatlist` 分支（把訊息列表由 ListView 改成 `FlatList`，見 `src/MessageContainer.js`）；本機 `master` 只是 2018-04-14 的上游快照，**不要在 master 上工作**，上游 master 之後的 8 個 commit 並未併入。
- 在那之上有 21 個 fork 專屬 commit：回覆訊息列、`inputToolbarStyle`、`minInputToolbarHeight` 可動態調整、`imageFullSize`、Android 13+ 輸入卡頓緩解、RN 0.77 的 Legacy Context 遷移等。逐項清單與原因見 `docs/agent/fork-changes.md`。
- 元件 props 與用法以**上游 `README.md` 和 `index.d.ts` 為準**（兩者維持上游內容，不要改寫）；但 fork 新增的 props 沒有進 `index.d.ts`，要查請看 `docs/agent/fork-changes.md`。

## 技術棧與入口
- 純 JS（class + function component，無 TypeScript 原始碼、**沒有 build 步驟**）。`index.js` 只有一行 `export * from './src/GiftedChat'`，`package.json` 的 `main` 指向它；使用端直接吃 git 上的原始碼。
- `package.json` 的 `version` 是 0.4.3（fork 之後沒 bump 過），不能用它辨識版本；一律用 commit hash。
- `peerDependencies` 的 react 寫 `*`，但程式已需要 React ≥ 16.8；開發依賴很舊（RN 0.51 / React 16.2 / jest 22 / eslint 4），測試環境因此無法代表實際執行環境（目標是 RN 0.77 + React 18）。

## 常用指令
- `yarn lint`（`eslint . --ext .js,.jsx`）、`yarn test`（`jest --no-watchman`，測試在 `src/__tests__/`，含 snapshot）。
- 本機沒有 `node_modules`，這些指令是否仍能在現行環境跑通**未驗證**；jest 測試是否仍要維護、預期是否為綠燈也未決定。
- 不要執行 `yarn appr` / `yarn deploy`：那是上游的 Expo 發佈流程（需要上游帳號）。

## 目錄速查
- `src/` 是套件本體；`src/GiftedChat.js` 是入口元件（Provider、鍵盤處理、輸入列高度計算）。
- `example/`、`example-expo/`、`example-slack-message/`、`screenshots/`：上游示範專案，不屬於套件（`.npmignore` 排除），不必維護。
- `src/GiftedChat.js.bak`：舊版本備份，**不在版控內**（`*.bak` 被忽略），內容與現行不同（還是舊式 `getChildContext`），不要當依據。

## 引用方式
使用端用 **commit hash 釘死**，沒有 npm publish：`package.json` 寫成 `"react-native-gifted-chat": "https://github.com/howg0924/react-native-gifted-chat.git/#<hash>"`，`yarn.lock` 的 key 與 `resolved` 也帶同一個 hash。

- 流程：在本 repo commit 並 push 到 `origin/modified-for-flatlist` → 使用端把 `package.json` 的 `#<hash>` 與 `yarn.lock` 對應的 key／`resolved` 兩處換成新 hash → 重新安裝。
- **先 push 再改 pin**：hash 必須已存在於 GitHub，使用端才裝得到。agent 不要自行 `git push`，除非使用者明確要求。
- 動工前先 `git fetch`：本機 `origin/modified-for-flatlist` 追蹤位置只代表上次 fetch 的結果，本機分支可能落後遠端。

## 必守規則
- 修正放在**本 repo**，不要放進使用端的 `patch/node_modules/`。
- `React.createContext` / `useContext`（`src/GiftedChatContext.js`）需 React ≥ 16.8。
- 保留 fork 專屬行為（清單在 `docs/agent/fork-changes.md`）；日後若想併入上游變更，先逐項比對那份清單，不要整支 merge。
- 修改後在 RN 0.77 的真實 App 或模擬器驗證聊天室畫面（本 repo 的 jest 不涵蓋 RN 0.77 行為），再升 pin。

## 地雷
- `src/Composer.js` 在 Android API ≥ 33 改用 `defaultValue`（非受控）取代 `value`（`af13b86`，緩解 Android 13 輸入越打越慢）：在這個平台上，程式端改 `text` prop 不會更新輸入框內容。動 Composer／清空輸入框的邏輯前務必先讀這段；若使用端在輸入框掛載後才非同步設定 `text`（例如還原草稿），在此平台可能出現輸入框空白但送出鈕存在。
- **不要把本 repo 的 jest 結果當驗證依據**：devDependencies 的 React 16.2.0 沒有 `createContext`／`useContext`，`d84fdc5` 之後相關元件在該版本載入就會失敗；改在 RN 0.77 的真實 App 驗證。
- `InputToolbar` 的 `keyboardWillShow`／`keyboardWillHide` 處理把整個 state 物件與字串比較，條件恆為真而每次都 `setState`（尚未修）。
- `5605436` 已把 `GiftedChat` / `InputToolbar` 的 `componentWillMount`、`componentWillReceiveProps` 移到 constructor／`componentDidUpdate`（React 18 會警告）；不要再引入舊生命週期。
- `example/android/keystores/` 在版控內（RN 範本的 debug 設定），未檢視內容；不要把任何真實簽章資訊放進這個 repo。

## 延伸文件（需要時才讀）
- `docs/agent/fork-changes.md` — 要改動或審視 fork 專屬行為、想併入上游變更、或查 fork 新增的 props 時
- `README.md` — 上游使用說明（API、props、安裝），不要改寫
