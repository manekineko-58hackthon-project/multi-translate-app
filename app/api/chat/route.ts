import { MAX_TEXT_LENGTH } from "@/lib/constants";
import { streamClaude } from "@/lib/claude";
import { buildSystemPrompt } from "@/lib/knowledge";
import type { ChatMessage, ChatRequest, ChatRole } from "@/lib/types";

const VALID_ROLES = new Set<ChatRole>(["worker", "employer"]);

/**
 * POST /api/chat
 * 労働法コンプラQ&Aエージェント。会話履歴と立場（労働者/雇用者）を受け取り、
 * Claude の回答を text/plain でストリーミングする。
 * ANTHROPIC_API_KEY 未設定時はモック回答をストリーミングし、キーなしでもデモできるようにする。
 */
export async function POST(request: Request): Promise<Response> {
  let payload: Partial<ChatRequest>;
  try {
    payload = (await request.json()) as Partial<ChatRequest>;
  } catch {
    return textError("リクエストボディが不正です", 400);
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const role = payload.role;
  const language = payload.language || "Japanese";

  if (messages.length === 0) {
    return textError("質問を入力してください", 400);
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return textError("質問を入力してください", 400);
  }
  if (last.content.length > MAX_TEXT_LENGTH) {
    return textError(
      `質問が長すぎます（${MAX_TEXT_LENGTH.toLocaleString()}文字以内にしてください）`,
      400
    );
  }
  if (!role || !VALID_ROLES.has(role)) {
    return textError("立場（労働者 / 雇用者）が不正です", 400);
  }

  // ANTHROPIC_API_KEY が無ければモックをストリーミング（デモ用）。
  if (!process.env.ANTHROPIC_API_KEY) {
    return streamText(mockChunks(role, last.content));
  }

  const systemPrompt = buildSystemPrompt(role) + `\n\n【重要】\n以下の質問に対しては、必ず「${language}」で回答を出力してください。`;

  let iterator: AsyncGenerator<string>;
  try {
    iterator = streamClaude(messages as ChatMessage[], systemPrompt);
  } catch (err) {
    return textError(toMessage(err), 502);
  }

  return streamText(iterator);
}

/** text/plain のエラーレスポンス */
function textError(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : "回答の生成中にエラーが発生しました";
}

/** 文字列の async iterator を text/plain のストリーミングレスポンスに変換する */
function streamText(source: AsyncIterable<string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of source) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n⚠️ ${toMessage(err)}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** ANTHROPIC_API_KEY 未設定時のダミー回答（条文の固定文をチャンク分割で返す） */
async function* mockChunks(
  role: ChatRole,
  question: string
): AsyncGenerator<string> {
  const roleLabel = role === "worker" ? "労働者" : "雇用者";
  const text = `【Claude未接続（モック回答）】ANTHROPIC_API_KEY を設定すると、実際のAI回答が表示されます。

ご質問（${roleLabel}の立場）:「${question}」

参考までに、労働基準法では時間外労働の割増賃金は25%以上、法定休日労働は35%以上と定められています（労働基準法第37条）。

※これは条文にもとづく一般的な情報です。個別の判断は専門家にご相談ください。`;

  // ストリーミングの体験を再現するため、文を区切って少しずつ返す。
  const parts = text.split(/(?<=。|\n)/);
  for (const part of parts) {
    yield part;
    await new Promise((r) => setTimeout(r, 40));
  }
}
