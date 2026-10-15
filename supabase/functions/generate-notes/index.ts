
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // 1. Check authentication.
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { error: "Please sign in first." },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse(
        { error: "Supabase environment variables are missing." },
        500,
      );
    }

    if (!geminiKey) {
      return jsonResponse(
        {
          error:
            "GEMINI_API_KEY is missing from Supabase Edge Function Secrets.",
        },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const { data, error: authError } =
      await supabase.auth.getUser();

    if (authError || !data.user) {
      return jsonResponse(
        { error: "Your session is invalid. Please sign in again." },
        401,
      );
    }

    // 2. Read and validate the transcript.
    let body: { transcript?: unknown };

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Invalid JSON request body." },
        400,
      );
    }

    const transcript =
      typeof body.transcript === "string"
        ? body.transcript.trim()
        : "";

    if (!transcript || transcript.length > 20000) {
      return jsonResponse(
        {
          error:
            "Please provide a transcript between 1 and 20,000 characters.",
        },
        400,
      );
    }

    // 3. Prepare the clinical note prompt.
    const prompt = `
You are an assistant that drafts clinical notes from medical transcripts.

Create a draft SOAP note using ONLY facts explicitly stated in the transcript.

Return a valid JSON object with exactly these keys:
{
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "review_flags": ["string"]
}

Rules:
- Do not invent findings, diagnoses, medications, doses, or advice.
- Preserve clinically important negations.
- Do not infer facts that are not stated.
- For missing information, write "Not documented in the transcript."
- If no diagnosis is stated, write:
  "Diagnosis not specified in the transcript. Clinician assessment required."
- Include only explicitly stated actions in the plan.
- Flag ambiguity, missing critical details, and clinical uncertainty.
- This is a draft for clinician review, not a finalized medical record.
- Return JSON only. Do not use Markdown fences.

TRANSCRIPT:
${transcript}
`;

    // Use the model confirmed in your available-model listing.
    const primaryModel =
  Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash-lite";

    // Optional: set this to another model verified for your API key.
    const fallbackModel =
      Deno.env.get("GEMINI_FALLBACK_MODEL") || "";

    const models = [
      primaryModel,
      ...(fallbackModel && fallbackModel !== primaryModel
        ? [fallbackModel]
        : []),
    ];

    let aiData: any = null;
    let lastStatus = 502;
    let successfulModel = "";

    // 4. Retry temporary failures, then try the optional fallback.
    modelLoop:
    for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        let response: Response;

        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiKey,
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: prompt }],
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  responseMimeType: "application/json",
                },
              }),
              signal: AbortSignal.timeout(45000),
            },
          );
        } catch (error) {
          console.error("Gemini connection error:", {
            model,
            message:
              error instanceof Error ? error.message : "Network error",
          });

          lastStatus = 502;

          if (attempt < 2) {
            await sleep(1000 * 2 ** attempt);
            continue;
          }

          // Move to the fallback model if configured.
          continue modelLoop;
        }

        let responseData: any;

        try {
          responseData = await response.json();
        } catch {
          responseData = {};
        }

        if (response.ok) {
          aiData = responseData;
          successfulModel = model;
          break modelLoop;
        }

        lastStatus = response.status;

        console.error("Gemini API request failed:", {
          model,
          status: response.status,
          error:
            responseData?.error?.message ?? "Unknown Gemini API error",
          code: responseData?.error?.status,
        });

        const temporaryError = [
          429, 500, 502, 503, 504,
        ].includes(response.status);

        if (temporaryError && attempt < 2) {
          await sleep(1000 * 2 ** attempt);
          continue;
        }

        if (!temporaryError) {
          return jsonResponse(
            {
              error:
                response.status === 400
                  ? "Gemini rejected the request. Check the request configuration."
                  : response.status === 401 ||
                      response.status === 403
                    ? "Gemini authentication failed. Check GEMINI_API_KEY and API access."
                    : response.status === 404
                      ? "Gemini model not found. Check GEMINI_MODEL in Supabase Secrets."
                      : "Gemini request failed. Check the function logs.",
            },
            502,
          );
        }
      }
    }

    if (!aiData || !successfulModel) {
      console.error("All Gemini attempts failed.", {
        status: lastStatus,
      });

      return jsonResponse(
        {
          error:
            lastStatus === 429
              ? "Gemini quota or rate limit reached. Check your API usage limits."
              : lastStatus === 503 ||
                  lastStatus === 502 ||
                  lastStatus === 504
                ? "Gemini is temporarily unavailable. Please try again shortly."
                : "Gemini could not generate the note. Check the function logs.",
        },
        502,
      );
    }

    // 5. Extract the generated content.
    const generatedText =
      aiData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim();

    if (!generatedText) {
      console.error("Gemini returned no text.", {
        model: successfulModel,
        finishReason: aiData?.candidates?.[0]?.finishReason,
        promptFeedback: aiData?.promptFeedback,
      });

      return jsonResponse(
        { error: "Gemini returned an empty note. Please try again." },
        502,
      );
    }

    // 6. Parse and validate the generated JSON.
    let note: Record<string, unknown>;

    try {
      note = JSON.parse(generatedText);
    } catch {
      console.error("Gemini returned invalid JSON.", {
        model: successfulModel,
      });

      return jsonResponse(
        {
          error:
            "Gemini returned an invalid note format. Please try again.",
        },
        502,
      );
    }

    // 7. Return the fields expected by app.js.
    return jsonResponse({
      subjective:
        typeof note.subjective === "string"
          ? note.subjective
          : "Not documented in the transcript.",

      objective:
        typeof note.objective === "string"
          ? note.objective
          : "Not documented in the transcript.",

      assessment:
        typeof note.assessment === "string"
          ? note.assessment
          : "Diagnosis not specified in the transcript. Clinician assessment required.",

      plan:
        typeof note.plan === "string"
          ? note.plan
          : "Not documented in the transcript.",

      review_flags:
        Array.isArray(note.review_flags)
          ? note.review_flags
              .filter((flag) => typeof flag === "string")
              .slice(0, 12)
          : [],
    });
  } catch (error) {
    console.error(
      "generate-notes error:",
      error instanceof Error ? error.message : "Unexpected error",
    );

    return jsonResponse(
      { error: "An unexpected server error occurred." },
      500,
    );
  }
});
