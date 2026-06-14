import type { Metadata } from "next";
import Link from "next/link";
import CheckPage from "@/components/check/check-page";

export const metadata: Metadata = {
  title: "AI コンプラチェック — 多言語労働文書翻訳アプリ",
  description:
    "労働契約書を AI が労働基準法の7項目に基づいて自動チェック。賃金・労働時間・休日・割増賃金・有給休暇・解雇予告・試用期間を並行分析。",
};

export default function Page() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-wider text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← 翻訳アプリに戻る
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            AI 労働コンプライアンス・チェック
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            あなたの労働契約書や労働条件通知書を、最新のAI（Claude）が日本の労働基準法に基づき並行チェックします。
            母国語での詳細な解説と改善提案を確認して、安全に働きましょう。
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-6">
        <CheckPage />
      </main>
    </div>
  );
}
