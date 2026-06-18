// アプリ全体で共有する型定義

/** DeepL の翻訳先言語コード（source は常に JA） */
export type TargetLangCode =
  | "VI"
  | "EN-US"
  | "ZH-HANS"
  | "KO"
  | "PT-BR"
  | "ID";

/** 翻訳先言語の選択肢 */
export interface LangOption {
  /** DeepL の target_lang コード */
  code: TargetLangCode;
  /** UI 表示名（日本語） */
  label: string;
  /** その言語自身での名称（ネイティブ表記） */
  nativeName: string;
}

/** 文書種別の選択肢 */
export interface DocType {
  /** 内部識別子 */
  id: string;
  /** UI 表示名（日本語） */
  label: string;
}

/** /api/translate へのリクエストボディ */
export interface TranslateRequest {
  text: string;
  targetLang: TargetLangCode;
}

/** /api/translate のレスポンス */
export interface TranslateResponse {
  /** 翻訳結果テキスト */
  translatedText: string;
  /** DeepL 未接続でモック翻訳を返したか */
  mock: boolean;
  /** エラー時のメッセージ */
  error?: string;
}

/** コンプラQ&Aエージェントの利用者の立場 */
export type ChatRole = "worker" | "employer";

/** チャット1件分のメッセージ */
export interface ChatMessage {
  /** user = 質問者、assistant = エージェントの回答 */
  role: "user" | "assistant";
  content: string;
}

/** /api/chat へのリクエストボディ */
export interface ChatRequest {
  /** これまでの会話履歴（最後の要素が最新の質問） */
  messages: ChatMessage[];
  /** 労働者 / 雇用者 のどちらの視点で回答するか */
  role: ChatRole;
  /** 回答する言語（任意） */
  language?: string;
}
