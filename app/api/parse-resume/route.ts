// app/api/parse-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { z } from "zod";
import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ResumeSchema, resumeJsonSchema } from "@/lib/resumeSchema";
// ────────────────────────────────────────────────
// Your Zod schema (same as before)
// ────────────────────────────────────────────────
const ResumeSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  address2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  jobRole: z.string().nullable().optional(),

  summary: z.string().nullable().optional(),
  skills: z.array(z.string()).optional().default([]),
  experience: z
    .array(
      z.object({
        company: z.string().nullable(),
        position: z.string().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        description: z.string().nullable(),
      })
    )
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string().nullable(),
        degree: z.string().nullable(),
        field: z.string().nullable(),
        graduationYear: z.string().nullable(),
      })
    )
    .optional()
    .default([]),
});

type ResumeData = z.infer<typeof ResumeSchema>;

// Convert Zod schema → JSON Schema (this is the fix)
const resumeJsonSchema = zodToJsonSchema(ResumeSchema, {
  target: "openApi3",           // best compatibility with OpenAI/Grok
  $refStrategy: "none",         // avoid $refs if possible
});

// ────────────────────────────────────────────────
// Grok client
// ────────────────────────────────────────────────
const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY ?? process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// ────────────────────────────────────────────────
// POST handler
// ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No resume file uploaded" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let resumeText = "";
    if (file.type === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } else {
      return NextResponse.json(
        { error: "Only PDF files are supported at this time" },
        { status: 415 }
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract any text from the PDF" },
        { status: 400 }
      );
    }

    // Call Grok with structured output
    const completion = await grok.chat.completions.create({
      model: "grok-beta", // or "grok-2-latest" — check docs.x.ai
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume parser. Extract structured information accurately. " +
            "Be conservative — if unclear or missing, use null or empty string. " +
            "Format dates naturally (e.g. 'Mar 2023 – Present'). " +
            "Split bullet points into arrays when possible. " +
            "Return ONLY valid JSON — no explanations, no markdown, no code blocks.",
        },
        {
          role: "user",
          content: `Parse this resume:\n\n${resumeText.slice(0, 32000)}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2500,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume_extraction",
          strict: true,
          schema: resumeJsonSchema, // ← this is now correct
        },
      },
    });

    const message = completion.choices[0]?.message;

    if (!message?.content) {
      return NextResponse.json(
        { error: "No valid response from Grok" },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(message.content);
    } catch (jsonError) {
      console.error("JSON parse failed:", message.content);
      return NextResponse.json(
        { error: "AI response was not valid JSON" },
        { status: 500 }
      );
    }

    const validationResult = ResumeSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error("Zod validation failed:", validationResult.error.format());
      return NextResponse.json(
        {
          error: "Structured data did not match expected schema",
          details: validationResult.error.format(),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: validationResult.data,
      rawTextExcerpt: resumeText.slice(0, 500) + (resumeText.length > 500 ? "..." : ""),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Resume parsing failed:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}