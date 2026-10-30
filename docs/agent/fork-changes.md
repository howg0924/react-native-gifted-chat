> 用途：列出本 fork 相對上游 gifted-chat 的所有專屬改動（含為什麼改、改在哪），避免被誤還原或在併入上游時遺失。　何時讀：要改 `src/` 任何元件、審視某個行為是不是刻意的、或想併入上游變更時。
> 驗證基準：commit 0f3cd69（2026-10-30）

範圍：`master..modified-for-flatlist` 中 fork 作者的 21 個 commit（`master` 是 2018-04-14 的上游快照）。更早的 51 個 commit 來自上游的 `modified-for-flatlist` 分支（Darren Liew、Xavier Carpentier 等人把 ListView 改為 `FlatList`、效能調整、Expo 範例），不是本 fork 的改動。元件通用用法請看上游 `README.md`。

## 一、fork 專屬 props／行為

| 項目 | 位置 | 說明（commit） |
|---|---|---|
| `renderRepliedMessage(props)` | `src/InputToolbar.js::renderRepliedMessage` | 在輸入列最上方多渲染一塊「回覆中的訊息」（`4569ea7`）。它佔的高度**不會**自動算進輸入列，必須由使用端把高度加進 `minInputToolbarHeight`。 |
| `minInputToolbarHeight` 可動態改 | `src/GiftedChat.js::getMinInputToolbarHeight`、`componentDidUpdate` | 上游把它當固定值（有 `renderAccessory` 時還乘 2）；fork 直接回傳 prop，prop 變動時重算訊息區高度（`f484679`）。可用它容納 accessory 面板與回覆列。 |
| `inputToolbarStyle` | `src/InputToolbar.js::render` | 只套在 InputToolbar 外層 container（`1aafd5a`）。原因：`containerStyle` 也會傳給 `Send`，指定背景色會讓 `Send`（固定高 44）凸出輸入列。要改輸入列底色請用它，不要用 `containerStyle`。 |
| `imageFullSize`（訊息欄位） | `src/MessageImage.js::MessageImage` | lightbox 放大時優先用 `currentMessage.imageFullSize`，沒有才用 `image`（`76945d0`）。 |
| `alwaysShowSend`、`disabled`（Send） | `src/Send.js::Send` | 文字為空也顯示送出鈕；可停用（`32f39b1`）。 |
| `renderCustomView`／`renderMessageImage` 收到 `context` | `src/Bubble.js` | 傳給這兩個 render 函式的 props 多帶一個 `context`（`0d9cb23`、`4569ea7`）。注意：`d84fdc5` 之後 `Bubble.context` 是 `GiftedChatContext` 的值（`{actionSheet, getLocale}`）。 |
| 空訊息時仍渲染 `FlatList` | `src/MessageContainer.js::render` | 上游在沒有訊息時回傳空 `View`，導致 `keyboardShouldPersistTaps`、`listViewProps`（例如背景色）無效；fork 拿掉該判斷（`75e85cb`）。 |

以上 props 都**沒有**寫進 `index.d.ts`（fork 的 21 個 commit 完全沒動過該檔）；使用 TypeScript 的專案需自行補型別。

## 二、穩定性／相容性修正（不要還原）

| 問題 | 位置 | 修法（commit） |
|---|---|---|
| iOS 崩潰：A 聊天室開著鍵盤 → 背景 → 推播開 B 聊天室（沒有鍵盤）時，`onKeyboardWillHide` 觸發但 `messagesContainerHeight` 仍是 `null` | `src/GiftedChat.js::onKeyboardWillShow`／`onKeyboardWillHide` | 值為空時先 `setState` 建立 `Animated.Value`，不為空才 `Animated.timing`（`746fa76`）。 |
| 輸入列在鍵盤出現時沒有上推 | `src/GiftedChat.js`（`Keyboard.addListener`） | 改用 `Keyboard.addListener` 自行註冊 `keyboardWillShow`／`DidShow`／`WillHide`／`DidHide` 四個事件、卸載時 `.remove()`，取代原本以 props 傳入的 `onKeyboard*` 處理函式（`06e78be`）。 |
| 首次 render 會呼叫 `notifyInputTextReset()`，把使用端放進 composer 的預設文字清掉 | `src/GiftedChat.js` | 移除該次呼叫（`1e5944e`）。 |
| Android 13+（API ≥ 33）輸入越打越慢、ANR | `src/Composer.js::render` | 該平台改用 `defaultValue`（非受控）取代 `value`（`af13b86`；相關 RN issue 連結在該 commit 訊息）。**副作用：程式端改 `text` prop 不會更新輸入框**（若在輸入框掛載後才非同步設定 `text`，例如還原草稿，可能出現輸入框空白但送出鈕存在）。 |
| 早期同一問題的另一種做法 | — | `6139041` 已被 `f8322cc` revert（當時因為升 RN 版本而不需要）；不要再套用。 |
| React 18 警告 `componentWillMount`／`componentWillReceiveProps` | `src/GiftedChat.js`、`src/InputToolbar.js` | 搬到 constructor／`componentDidUpdate`（鍵盤監聽也改在 constructor 註冊）（`5605436`）。 |
| iOS 警告 `useNativeDriver was not specified` | `src/GiftedChat.js`（兩處 `Animated.timing`） | 明確指定 `useNativeDriver: false`（`36e9c7d`）。 |
| React 18 警告 function 元件的 `defaultProps` 已被棄用 | `src/Day.js`、`MessageImage.js`、`Send.js`、`SystemMessage.js`、`Time.js` | 預設值改成函式參數預設值（`c37c5ca`）。 |
| React 18.3 警告：把含 `key` 的 props 物件 spread 進 JSX | `src/MessageContainer.js` | `key` 從 `messageProps` 移出，改為 `<Message key={item._id} {...messageProps} />`；`renderMessage` 路徑是純函式呼叫，不受影響，仍帶 `key`（`67e9dcf`）。 |
| RN 0.77 打開聊天室畫面崩潰 `Cannot read property 'getLocale' of undefined`（`Day`） | `src/GiftedChatContext.js`（新）、`GiftedChat.js`、`Day.js`、`Time.js`、`Actions.js`、`Bubble.js`、`MessageText.js` | RN 0.77 內建的 React renderer 已不支援 Legacy Context（`contextTypes`／`getChildContext`）。改成 `React.createContext`：`GiftedChat` 的 constructor 建立一次 `this._contextValue` 並以 `Provider` 包住 render 兩個分支；function 元件（`Day`、`Time`）用 `React.useContext`，class 元件用 `static contextType`（`d84fdc5`）。**新增任何要讀 `actionSheet`／`getLocale` 的元件都必須走這條路，不可再宣告 `contextTypes`。** |
| iOS 26+ 聊天室一片空白：訊息區高度的小數部分落在約 0.2～0.5（3x 螢幕上高度像素數除以 3 餘 1，例如 iPhone 14 Plus 開「螢幕縮放：放大文字」後的 643.333），而且開了「減少透明度」時，UIKit 替倒置列表啟用不透明的捲動邊緣效果、蓋住整個列表；鍵盤彈出（高度改變）才暫時出現 | `src/GiftedChat.js::getWholePointMessagesContainerHeight`、`renderMessages` | 交給原生層的容器 `height` 在 iOS 一律捨去成整數點（數值 `Math.floor(h + 0.001)`；鍵盤動畫的 `Animated.Value` 用 `v - (v % 1)` 每一幀捨去），state 不動，Android 原樣回傳（`0f3cd69`）。**這只是第一層**：還需要在 App 端隱藏倒置捲動區的 `topEdgeEffect`（react-native-navigation 的原生層）；UIKit 為何在該高度啟用邊緣效果沒查出來。 |

## 三、版面微調（iOS／Android 外觀，改動前先看效果）

- `Composer.js`：文字垂直置中（`textAlignVertical: 'center'`、padding／margin 設 0，`a446943`）。
- `InputToolbar.js`：`primary` 區塊 `alignItems: 'center'`，高度取 `composerHeight`（`f484679` 先加 10，`f600f26` 又移除多餘間距）。

## 四、併入上游時的檢查清單
1. 上游 `master`（本機快照）有 8 個 `modified-for-flatlist` 沒有的 commit（含上游自己的 `always show send` 實作 `a830d65`，與 fork 的 `alwaysShowSend` 並存的話要擇一）。
2. 逐項對照上面三個表格，確認每個專屬行為都還在。
3. 不要整支 `merge`：兩條線已分叉 72／8 個 commit，且 `FlatList` 改寫會大量衝突。
4. 合併後必須在 RN 0.77 的真實 App 驗證聊天室畫面：開啟不崩潰、日期分隔／時間戳正常、長按訊息可彈出 ActionSheet、回覆列高度正確、Android 13 輸入流暢。
