import TranslatorApp from "@/components/TranslatorApp";
import Link from "next/link";

const FLOW_STEPS = [
  "文書を入力（貼り付け / .txt / PDF）",
  "文書の種類・翻訳先の言語を選ぶ",
  "DeepLで翻訳し、原文と並べて確認",
  "不自然なら再翻訳プロンプトを生成・コピー",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              多言語労働文書翻訳アプリ
            </p>
            <Link
              href="/check"
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"
            >
              ✨ AIコンプラチェックはこちら &rarr;
            </Link>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            労働文書を、母国語で正しく理解する
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            働く人の権利を守り、雇う側の法令遵守を支援する AI エージェント。
            労働基準法の条文を根拠に、あなたの疑問にその場でお答えします。
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {[
              { icon: "👷", text: "労働者の権利を条文で確認" },
              { icon: "🏢", text: "雇用者の法令リスクを事前把握" },
              { icon: "🌏", text: "多言語で外国人労働者もサポート" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
              >
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-6">
        <ComplianceAgentApp />
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-6">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            ※ 本サービスの回答は労働基準法の条文にもとづく一般的な情報であり、法律相談ではありません。個別の判断は社会保険労務士・弁護士・労働基準監督署にご相談ください。
          </p>
        </div>
      </footer>
    </div>
  );
}
