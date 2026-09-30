// @ts-nocheck
"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { internal } from "./_generated/api";

// Models to try in order - newer first. The API deprecates old model names
// over time, so we fall back instead of hard-failing.
const TEXT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
];
const IMAGE_MODELS = [
  "gemini-3.8-flash-preview-image-generation",
  "gemini-2.0-flash-preview-image-generation",
];

function getApiKey(): string | null {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  return apiKey.trim();
}

/**
 * Generate text with Gemini, trying each configured model in order.
 * Throws with a friendly message if all fail or no key is set.
 */
async function generateWithGemini(prompt: string, systemHint?: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured on the backend.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of TEXT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(
        systemHint ? `${systemHint}\n\n${prompt}` : prompt
      );
      const text = result.response.text();
      if (text && text.trim().length > 0) return text.trim();
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || "");
      // Only fall through on "model not available/deprecated" style errors;
      // rethrow quota/auth errors immediately.
      if (/API key|quota|permission|billing/i.test(msg)) throw err;
      console.warn(`[AI] model ${modelName} failed, trying next:`, msg.substring(0, 140));
    }
  }
  throw lastError || new Error("No Gemini model available");
}

/**
 * Generate a doodle-style illustration. Returns base64 PNG data, or null.
 */
async function generateDoodleImage(eventName: string): Promise<{ base64: string; mimeType: string } | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const prompt = `A fun, colorful doodle-style illustration representing "${eventName}". Hand-drawn sketch style with vibrant colors, simple shapes, and playful elements. White background, clean and modern doodle art.`;

  try {
    // Try Imagen predict endpoint first
    const imagenResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "16:9" },
        }),
      }
    );

    if (imagenResp.ok) {
      const data = await imagenResp.json();
      const predictions = data.predictions;
      if (predictions && predictions.length > 0 && predictions[0].bytesBase64Encoded) {
        return { base64: predictions[0].bytesBase64Encoded, mimeType: "image/png" };
      }
    }

    // Fallback: image-output Gemini models, newest first
    for (const modelName of IMAGE_MODELS) {
      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
            generationConfig: { responseModalities: ["IMAGE"] },
          }),
        }
      );

      if (geminiResp.ok) {
        const data = await geminiResp.json();
        const parts = data.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              return {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || "image/png",
              };
            }
          }
        }
      } else {
        const errText = await geminiResp.text().catch(() => "");
        console.warn(`[Image Gen] ${modelName} status ${geminiResp.status}:`, errText.substring(0, 160));
      }
    }

    return null;
  } catch (err) {
    console.error("[Image Gen] Error:", err);
    return null;
  }
}

/**
 * Fallback: fetch a relevant image from Unsplash search
 */
async function fetchUnsplashImageUrl(keyword: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(keyword)}&per_page=3`,
      { headers: { Accept: "application/json" } }
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        const idx = Math.floor(Math.random() * Math.min(3, data.results.length));
        const photo = data.results[idx];
        const rawUrl = photo.urls?.raw;
        if (rawUrl) {
          return `${rawUrl}&w=800&h=400&fit=crop&q=80`;
        }
        return photo.urls?.regular || photo.urls?.small || "";
      }
    }
  } catch (err) {
    console.error("[Unsplash] Fetch error:", err);
  }
  return `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop&q=80`;
}

function deriveKeyword(eventName: string): string {
  return eventName.split(/\s+/).slice(0, 2).join(" ").toLowerCase() || "event";
}

export const enhanceEventDescription = action({
  args: {
    description: v.string(),
  },
  handler: async (_ctx, args) => {
    try {
      const enhanced = await generateWithGemini(
        `Please enhance this event description:\n\n${args.description}`,
        `You are an expert event copywriter. Rewrite the given event description to be more engaging, well-structured, and professional. Use short paragraphs and bullet points where appropriate. Keep it concise but informative. Do NOT add any markdown headers or code blocks - just clean formatted text with line breaks and bullet points. Keep the tone enthusiastic but professional. Do not invent details that aren't in the original.`
      );
      return { success: true, enhanced };
    } catch (err: any) {
      console.error("[AI Enhance] Error:", err);
      const msg = String(err?.message || "");
      const friendly = /not configured/i.test(msg)
        ? "AI is not configured on the server (missing GOOGLE_GEMINI_API_KEY)."
        : /quota|billing|permission|API key/i.test(msg)
          ? "AI quota or key problem - check the Gemini API key on the server."
          : "AI enhancement is unavailable right now. Please try again later.";
      return { success: false, enhanced: null, error: friendly };
    }
  },
});

/**
 * Ask Eventure's AI assistant anything about the platform / events.
 * Public action - used by the floating chat widget.
 */
export const askEventure = action({
  args: {
    question: v.string(),
    history: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        })
      )
    ),
  },
  handler: async (_ctx, args) => {
    const trimmed = args.question.trim();
    if (!trimmed) {
      return { success: false, answer: null, error: "Please type a question first." };
    }
    if (trimmed.length > 2000) {
      return { success: false, answer: null, error: "That question is too long - please shorten it." };
    }

    const systemHint = `You are "Eventure AI", the friendly assistant built into Eventure - a campus event management platform. Eventure lets students: browse and register for events (some are paid, with a mock payment flow), get a unique 8-character check-in code + QR code per registration (shown via email; scan or enter it at the event to check in), download certificates for attended events, chat in per-event channels and read admin broadcasts in Communications, create support tickets, and edit their profile (name, roll no, branch, mobile). Organizers use the Admin Panel at /admin-signIn to create events, check people in, view analytics, manage tickets and communicate with attendees.

Answer questions about how to use Eventure, events, check-in, certificates, and general event-help topics. Be concise (2-6 sentences unless asked for more), friendly, and practical. If asked something completely unrelated to Eventure or events, answer briefly then gently steer back to Eventure.`;

    const historyText = (args.history || [])
      .slice(-6)
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n");

    const prompt = historyText
      ? `Conversation so far:\n${historyText}\n\nUser: ${trimmed}`
      : trimmed;

    try {
      const answer = await generateWithGemini(prompt, systemHint);
      return { success: true, answer };
    } catch (err: any) {
      console.error("[AskEventure] Error:", err);
      const msg = String(err?.message || "");
      const error = /not configured/i.test(msg)
        ? "AI is not configured on the server yet."
        : /quota|billing|permission|API key/i.test(msg)
          ? "AI is temporarily unavailable (quota/key issue). Try again soon."
          : "AI is busy right now - please try again in a moment.";
      return { success: false, answer: null, error };
    }
  },
});

export const generateEventImageUrl = action({
  args: {
    eventName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Try Gemini image generation first
      const imageData = await generateDoodleImage(args.eventName);

      if (imageData) {
        // Store in Convex file storage
        const binaryData = Uint8Array.from(atob(imageData.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([binaryData], { type: imageData.mimeType });
        const storageId = await ctx.storage.store(blob);
        const imageUrl = await ctx.storage.getUrl(storageId);

        if (imageUrl) {
          return { success: true, imageUrl, keyword: "gemini-generated" };
        }
      }

      // Fallback to Unsplash
      const keyword = deriveKeyword(args.eventName);
      const imageUrl = await fetchUnsplashImageUrl(keyword);
      return { success: true, imageUrl, keyword };
    } catch (err: any) {
      console.error("[AI Image] Error:", err);
      return { success: false, imageUrl: null, error: err?.message || "Failed to generate image" };
    }
  },
});

export const generateImagesForAllEvents = action({
  args: {
    overwrite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const events = args.overwrite
      ? await ctx.runQuery(internal.events.getAllEventsForImageRegeneration)
      : await ctx.runQuery(internal.events.getEventsWithoutImage);

    if (events.length === 0) {
      return { success: true, message: "All events already have images", count: 0 };
    }

    let updated = 0;
    let aiGenerated = 0;

    for (const event of events) {
      try {
        // Try Gemini image generation
        const imageData = await generateDoodleImage(event.name);

        if (imageData) {
          const binaryData = Uint8Array.from(atob(imageData.base64), (c) => c.charCodeAt(0));
          const blob = new Blob([binaryData], { type: imageData.mimeType });
          const storageId = await ctx.storage.store(blob);
          const imageUrl = await ctx.storage.getUrl(storageId);

          if (imageUrl) {
            await ctx.runMutation(internal.events.setEventImageUrl, {
              eventId: event._id,
              imageUrl,
            });
            updated++;
            aiGenerated++;
            continue;
          }
        }

        // Fallback to Unsplash
        const keyword = deriveKeyword(event.name);
        const imageUrl = await fetchUnsplashImageUrl(keyword);
        await ctx.runMutation(internal.events.setEventImageUrl, {
          eventId: event._id,
          imageUrl,
        });
        updated++;
      } catch (err) {
        console.error(`[Image Gen] Failed for event "${event.name}":`, err);
        // Continue with next event
      }
    }

    return {
      success: true,
      message: `${args.overwrite ? "Regenerated" : "Generated"} images for ${updated} event${updated !== 1 ? "s" : ""} (${aiGenerated} AI-generated, ${updated - aiGenerated} from Unsplash)`,
      count: updated,
    };
  },
});

export const generateAndSetEventImage = internalAction({
  args: {
    eventId: v.id("events"),
    eventName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Try Gemini image generation
      const imageData = await generateDoodleImage(args.eventName);

      if (imageData) {
        const binaryData = Uint8Array.from(atob(imageData.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([binaryData], { type: imageData.mimeType });
        const storageId = await ctx.storage.store(blob);
        const imageUrl = await ctx.storage.getUrl(storageId);

        if (imageUrl) {
          await ctx.runMutation(internal.events.setEventImageUrl, {
            eventId: args.eventId,
            imageUrl,
          });
          return;
        }
      }

      // Fallback to Unsplash
      const keyword = deriveKeyword(args.eventName);
      const imageUrl = await fetchUnsplashImageUrl(keyword);
      await ctx.runMutation(internal.events.setEventImageUrl, {
        eventId: args.eventId,
        imageUrl,
      });
    } catch (err) {
      console.error(`[Auto Image Gen] Failed for event "${args.eventName}":`, err);
    }
  },
});
