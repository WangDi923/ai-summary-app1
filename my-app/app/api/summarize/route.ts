import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.DEEPSEEK_API_KEY;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个专业的学术和文档摘要助手。请为用户提供结构清晰、要点明确的摘要。" },
          { role: "user", content: text }
        ],
        stream: false
      })
    });

    const data = await response.json();
    return NextResponse.json({ summary: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: "AI processing failed" }, { status: 500 });
  }
}