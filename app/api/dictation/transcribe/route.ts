import OpenAI from "openai";
import { NextResponse } from "next/server";
import { scoreDictation } from "@/lib/dictation/score";

export const runtime = "nodejs";

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Transcription timed out.")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    const expectedText = String(formData.get("expectedText") ?? "").trim();
    const language = String(formData.get("language") ?? "nl").trim() || "nl";

    const isBlobLike =
      typeof audio === "object" &&
      audio !== null &&
      "arrayBuffer" in audio &&
      typeof (audio as Blob).arrayBuffer === "function";

    if (!isBlobLike) {
      return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
    }

    if (!expectedText) {
      return NextResponse.json({ error: "Missing expectedText." }, { status: 400 });
    }

    const audioBlob = audio as Blob;
    if (!audioBlob.size) {
      return NextResponse.json({ error: "Empty audio upload." }, { status: 400 });
    }
    const contentType = (audioBlob as Blob).type || "audio/webm";
    const ext = contentType.includes("mp4") ? "mp4" : "webm";
    const audioFile =
      audio instanceof File
        ? audio
        : new File([audioBlob], `recording.${ext}`, {
            type: contentType
          });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    let transcript = "";
    try {
      const transcription = await withTimeout(
        client.audio.transcriptions.create({
          file: audioFile,
          model: "gpt-4o-mini-transcribe",
          language
        }),
        30000
      );
      transcript = (transcription.text ?? "").trim();
    } catch {
      const fallback = await withTimeout(
        client.audio.transcriptions.create({
          file: audioFile,
          model: "gpt-4o-transcribe",
          language
        }),
        30000
      );
      transcript = (fallback.text ?? "").trim();
    }

    const { score, tokens } = scoreDictation(expectedText, transcript);

    return NextResponse.json({
      transcript,
      score,
      tokens
    });
  } catch (error) {
    console.error("Dictation transcription failed:", error);
    const message = error instanceof Error ? error.message : "Transcription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
