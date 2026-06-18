"use client";

import { useEffect, useRef, useState } from "react";
import { TARGET_LANGUAGES } from "@/lib/constants";
import { checkCompliance } from "@/lib/compliance";
import type { ComplianceItem } from "@/lib/compliance";
import type { ChatMessage, ChatRole, TargetLangCode, TranslateResponse } from "@/lib/types";
import ComplianceChecker from "@/components/ComplianceChecker";

const SAMPLE_QUESTIONS: Record<ChatRole, string[]> = {
  worker: [
    "残業代の割増率は何%ですか？",
    "試用期間中にクビになりました。予告は必要ですか？",
    "有給休暇は何日もらえますか？",
    "休日は週に何日なければいけませんか？",
  ],
  employer: [
    "月60時間超の残業の割増率を教えてください",
    "就業規則はいつ作る必要がありますか？",
    "労働契約書で必ず明示しなければいけない事項は？",
    "試用期間中の解雇に解雇予告は必要ですか？",
  ],
};

export default function ComplianceAgentApp() {
  const [role, setRole] = useState<ChatRole>("worker");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 契約書チェックパネル
  const [contractText, setContractText] = useState("");
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[] | null>(null);
  const [showChecker, setShowChecker] = useState(false);

  // 翻訳
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [translatingLang, setTranslatingLang] = useState<TargetLangCode>(TARGET_LANGUAGES[0].code);

  // チャット言語選択
  const [chatLang, setChatLang] = useState<string>("Japanese");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    // アシスタントの回答をストリームしながら state に追記する。
    const assistantIdx = nextMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, role, language: chatLang }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "通信エラー");
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = { role: "assistant", content: `⚠️ ${errText}` };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snapshot = accumulated;
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = { role: "assistant", content: snapshot };
          return updated;
        });
      }
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleRoleChange(next: ChatRole) {
    setRole(next);
    setMessages([]);
    setTranslations({});
    setError(null);
  }

  async function translateMessage(idx: number, content: string) {
    setTranslatingIdx(idx);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, targetLang: translatingLang }),
      });
      const data = (await res.json()) as TranslateResponse;
      if (data.error) throw new Error(data.error);
      setTranslations((prev) => ({ ...prev, [idx]: data.translatedText }));
    } catch (err) {
      setTranslations((prev) => ({
        ...prev,
        [idx]: `⚠️ 翻訳に失敗しました: ${err instanceof Error ? err.message : "不明なエラー"}`,
      }));
    } finally {
      setTranslatingIdx(null);
    }
  }

  function handleCheckCompliance() {
    if (!contractText.trim()) return;
    setComplianceItems(checkCompliance(contractText));
  }

  const roleLabel = role === "worker" ? "労働者" : "雇用者";

  return (
    <div className="flex flex-col gap-6">
      {/* 役割とチャット言語トグル */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            あなたの立場:
          </span>
          <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            {(["worker", "employer"] as ChatRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  role === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {r === "worker" ? "労働者" : "雇用者（使用者）"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            回答言語:
          </span>
          <select
            value={chatLang}
            onChange={(e) => setChatLang(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="Japanese">日本語</option>
            <option value="English">English</option>
            <option value="Chinese (Simplified)">中文 (简体)</option>
            <option value="Korean">한국어</option>
            <option value="Vietnamese">Tiếng Việt</option>
          </select>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setTranslations({}); }}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      {/* チャット本体 */}
      <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* メッセージ一覧 */}
        <div className="min-h-64 flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-2xl dark:bg-indigo-900/40">
                ⚖️
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {roleLabel}の立場で、労働法について何でも聞いてください
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  労働基準法の条文を根拠に24時間お答えします
                </p>
              </div>
              {/* サンプル質問チップ */}
              <div className="flex flex-wrap justify-center gap-2">
                {SAMPLE_QUESTIONS[role].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* アバター */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  >
                    {msg.role === "user" ? "あ" : "⚖️"}
                  </div>
                  {/* バブル */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-indigo-600 text-white"
                        : "rounded-tl-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>

                    {/* アシスタント回答への翻訳オプション */}
                    {msg.role === "assistant" && msg.content && !streaming && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-2.5 dark:border-zinc-700">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          この言語で読む:
                        </span>
                        <select
                          value={translatingLang}
                          onChange={(e) => setTranslatingLang(e.target.value as TargetLangCode)}
                          className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                        >
                          {TARGET_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.nativeName}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => translateMessage(idx, msg.content)}
                          disabled={translatingIdx === idx}
                          className="rounded border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          {translatingIdx === idx ? "翻訳中…" : "翻訳"}
                        </button>
                      </div>
                    )}
                    {/* 翻訳結果 */}
                    {translations[idx] && (
                      <div className="mt-2 rounded-lg bg-zinc-200/60 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200" style={{ whiteSpace: "pre-wrap" }}>
                        {translations[idx]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs dark:bg-zinc-800">
                    ⚖️
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce text-zinc-400" style={{ animationDelay: "0ms" }}>●</span>
                      <span className="animate-bounce text-zinc-400" style={{ animationDelay: "150ms" }}>●</span>
                      <span className="animate-bounce text-zinc-400" style={{ animationDelay: "300ms" }}>●</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* エラー */}
        {error && (
          <p className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {/* 入力欄 */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${roleLabel}として質問を入力… (Enter で送信 / Shift+Enter で改行)`}
              rows={2}
              disabled={streaming}
              className="flex-1 resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            >
              送信
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
            回答は労働基準法の条文に基づく一般情報です。最終的な判断は専門家にご相談ください。
          </p>
        </div>
      </div>

      {/* 契約書コンプライアンスチェック（副次機能） */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setShowChecker((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 sm:px-6"
        >
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              契約書コンプライアンスチェック（簡易）
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              労働契約書のテキストを貼り付けると7項目をキーワード診断します
            </p>
          </div>
          <span className="ml-3 text-zinc-400">{showChecker ? "▲" : "▼"}</span>
        </button>

        {showChecker && (
          <div className="border-t border-zinc-200 px-5 pb-5 pt-4 dark:border-zinc-800 sm:px-6">
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="労働契約書のテキストをここに貼り付けてください…"
              rows={6}
              className="w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <button
              onClick={handleCheckCompliance}
              disabled={!contractText.trim()}
              className="mt-2 rounded-xl bg-zinc-800 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              チェックする
            </button>
            {complianceItems && (
              <div className="mt-4">
                <ComplianceChecker items={complianceItems} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
