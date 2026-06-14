import { PERSONAS } from "@/lib/check/persona";
import { callPersona } from "@/lib/check/claude";
import type {
  CheckItemResult,
  ComplianceCheckResponse,
  PersonaStatus,
} from "@/lib/check/types";
import { promises as fs } from "fs";
import path from "path";

const MAX_CONTRACT_LENGTH = 30000;

export async function POST(request: Request): Promise<Response> {
  let body: { contractText?: string; language?: string };
  try {
    body = (await request.json()) as { contractText?: string; language?: string };
  } catch {
    return jsonError("リクエストボディが不正です", 400);
  }

  const contractText =
    typeof body.contractText === "string" ? body.contractText.trim() : "";
  const language = typeof body.language === "string" ? body.language : "Japanese";

  if (!contractText) {
    return jsonError("契約書テキストを入力してください", 400);
  }
  if (contractText.length > MAX_CONTRACT_LENGTH) {
    return jsonError(
      `テキストが長すぎます（${MAX_CONTRACT_LENGTH.toLocaleString()}文字以内）`,
      400,
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(buildMockResponse());
  }

  try {
    const rawResults = await Promise.all(
      PERSONAS.map(async (persona) => {
        let articleContent = "";
        try {
          const articlePath = path.join(process.cwd(), "docs", persona.articleDir, "article.md");
          articleContent = await fs.readFile(articlePath, "utf-8");
        } catch (e) {
          console.warn(`Failed to read article.md for ${persona.id}`);
        }

        const enhancedInstruction = articleContent 
          ? `${persona.systemInstruction}\n\n【参考資料: 関連法規・解説】\n以下の資料も考慮して判定を行ってください。\n---\n${articleContent}\n---`
          : persona.systemInstruction;

        const output = await callPersona(
          enhancedInstruction,
          contractText,
          language,
          {
            label: persona.label,
            legalRef: persona.legalRef,
            legalSummary: persona.legalSummary,
          }
        );
        return {
          id: persona.id,
          label: language === "Japanese" ? persona.label : (output.translatedLabel || persona.label),
          legalRef: language === "Japanese" ? persona.legalRef : (output.translatedLegalRef || persona.legalRef),
          legalSummary: language === "Japanese" ? persona.legalSummary : (output.translatedLegalSummary || persona.legalSummary),
          status: output.status,
          issue: output.issue || null,
          suggestion: output.suggestion || null,
        } satisfies CheckItemResult;
      }),
    );

    const response: ComplianceCheckResponse = {
      isCompliant: rawResults.every((r) => r.status !== "FAIL"),
      results: rawResults,
      mock: false,
    };

    return Response.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Compliance check error:", msg);
    if (/429|quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(msg)) {
      return jsonError(
        "Claude API のレート制限に達しました。30秒ほど待ってから再度お試しください",
        429,
      );
    }
    if (/API.?key|INVALID_ARGUMENT|401|403/i.test(msg)) {
      return jsonError("Claude API キーが無効です。.env を確認してください", 401);
    }
    return jsonError(
      "AI チェック中にエラーが発生しました。時間をおいて再度お試しください",
      500,
    );
  }
}

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

function buildMockResponse(): ComplianceCheckResponse {
  const mockStatuses: Record<string, PersonaStatus> = {
    wage: "PASS",
    working_hours: "PASS",
    holidays: "WARN",
    overtime_premium: "WARN",
    paid_leave: "PASS",
    dismissal_notice: "WARN",
    probation: "WARN",
  };

  const mockIssues: Record<string, string> = {
    holidays:
      "休日の記載はありますが、法定休日（週1日）の特定が不明確です",
    overtime_premium:
      "割増賃金の記載はありますが、月60時間超の割増率が明示されていません",
    dismissal_notice:
      "退職に関する記載はありますが、解雇予告手当への言及がありません",
    probation: "試用期間の記載が確認できません",
  };

  const mockSuggestions: Record<string, string> = {
    holidays: "法定休日を特定の曜日に指定し、明記することを推奨します",
    overtime_premium:
      "月60時間超の割増率（50%以上）を明記することを推奨します",
    dismissal_notice:
      "解雇予告手当（30日分以上の平均賃金）について明記してください",
    probation:
      "試用期間を設ける場合は、期間と条件を明記することを推奨します",
  };

  return {
    isCompliant: true,
    mock: true,
    results: PERSONAS.map((p) => ({
      id: p.id,
      label: p.label,
      legalRef: p.legalRef,
      legalSummary: p.legalSummary,
      status: mockStatuses[p.id] ?? "WARN",
      issue: mockIssues[p.id] ?? null,
      suggestion: mockSuggestions[p.id] ?? null,
    })),
  };
}
