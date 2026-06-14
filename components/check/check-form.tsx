"use client";

interface Props {
  contractText: string;
  onTextChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  onCheck: () => void;
  loading: boolean;
}

const UI_DICT: Record<string, any> = {
  Japanese: {
    label: "契約書テキスト（日本語）",
    outputLabel: "解説の言語:",
    placeholder: "ここに労働契約書や労働条件通知書の本文を貼り付けてください。スマートフォンで写真を撮ってテキストを抽出したものでも構いません。",
    button: "AI でチェックする",
    checking: "分析中...",
  },
  English: {
    label: "Contract Text (Japanese)",
    outputLabel: "Explanation Language:",
    placeholder: "Paste the text of your labor contract or working conditions notice here. You can also extract text from a photo.",
    button: "Check with AI",
    checking: "Analyzing...",
  },
  "Chinese (Simplified)": {
    label: "合同文本（日语）",
    outputLabel: "解释语言：",
    placeholder: "在此粘贴劳动合同或劳动条件通知书的文本。您也可以粘贴从照片中提取的文本。",
    button: "使用 AI 检查",
    checking: "分析中...",
  },
  Korean: {
    label: "계약서 텍스트 (일본어)",
    outputLabel: "설명 언어:",
    placeholder: "여기에 근로 계약서 또는 근로 조건 통지서의 텍스트를 붙여넣으세요. 사진에서 추출한 텍스트도 가능합니다.",
    button: "AI로 확인하기",
    checking: "분석 중...",
  },
  Vietnamese: {
    label: "Văn bản hợp đồng (Tiếng Nhật)",
    outputLabel: "Ngôn ngữ giải thích:",
    placeholder: "Dán văn bản hợp đồng lao động hoặc thông báo điều kiện làm việc vào đây. Bạn cũng có thể dán văn bản trích xuất từ ảnh.",
    button: "Kiểm tra bằng AI",
    checking: "Đang phân tích...",
  },
};

export default function CheckForm({
  contractText,
  onTextChange,
  language,
  onLanguageChange,
  onCheck,
  loading,
}: Props) {
  const t = UI_DICT[language] || UI_DICT.Japanese;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t.label}
          </label>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.outputLabel}
            </label>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="Japanese">日本語</option>
              <option value="English">English</option>
              <option value="Chinese (Simplified)">中文 (简体)</option>
              <option value="Korean">한국어</option>
              <option value="Vietnamese">Tiếng Việt</option>
            </select>
          </div>
        </div>
        
        <textarea
          value={contractText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={t.placeholder}
          rows={6}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {contractText.length > 0 &&
              `${contractText.length.toLocaleString()} chars`}
          </span>
          <button
            type="button"
            onClick={onCheck}
            disabled={loading || !contractText.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-600"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.checking}
              </>
            ) : (
              t.button
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
