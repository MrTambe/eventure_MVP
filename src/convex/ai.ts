"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { internal } from "./_generated/api";

function getGeminiModel() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

async function getKeywordFromAI(model: any, eventName: string): Promise<string> {
  try {
    const prompt = `Generate a single short search keyword (1-2 words) for finding a relevant stock photo for an event called "${eventName}". Only respond with the keyword, nothing else. Examples: "hackathon" → "coding", "sports meet" → "athletics", "cultural fest" → "festival", "workshop" → "classroom", "seminar" → "conference".`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text()?.trim();
    if (content) {
      return content.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "event";
    }
  } catch {
    // fall through
  }
  return eventName.split(/\s+/).slice(0, 2).join(" ").toLowerCase() || "event";
}

function deriveKeyword(eventName: string): string {
  return eventName.split(/\s+/).slice(0, 2).join(" ").toLowerCase() || "event";
}

async function fetchUnsplashImageUrl(keyword: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(keyword)}&per_page=3`,
      { headers: { Accept: "application/json" } }
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        // Pick a random one from top 3 for variety
        const idx = Math.floor(Math.random() * Math.min(3, data.results.length));
        const photo = data.results[idx];
        // Use the regular size URL (1080px wide) with crop params for 800x400
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
  // Fallback: return a known Unsplash photo URL for the keyword
  return `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop&q=80`;
}

export const enhanceEventDescription = action({
  args: {
    description: v.string(),
  },
  handler: async (_ctx, args) => {
    const model = getGeminiModel();
    if (!model) {
      return {
        success: false,
        enhanced: null,
        error: "GOOGLE_GEMINI_API_KEY is not configured. Please set it in the Integrations tab or API Keys → Backend.",
      };
    }

    try {
      const prompt = `You are an expert event copywriter. Rewrite the given event description to be more engaging, well-structured, and professional. Use short paragraphs and bullet points where appropriate. Keep it concise but informative. Do NOT add any markdown headers or code blocks — just clean formatted text with line breaks and bullet points (using • character). Keep the tone enthusiastic but professional. Do not invent details that aren't in the original.\n\nPlease enhance this event description:\n\n${args.description}`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const enhanced = response.text();

      if (enhanced && enhanced.trim().length > 0) {
        return { success: true, enhanced: enhanced.trim() };
      }
      return { success: false, enhanced: null, error: "No response from AI" };
    } catch (err: any) {
      console.error("[AI Enhance] Error:", err);
      const msg = err?.message || "AI enhancement failed";
      return { success: false, enhanced: null, error: msg };
    }
  },
});

export const generateEventImageUrl = action({
  args: {
    eventName: v.string(),
  },
  handler: async (_ctx, args) => {
    try {
      const model = getGeminiModel();
      const keyword = model
        ? await getKeywordFromAI(model, args.eventName)
        : deriveKeyword(args.eventName);

      const imageUrl = await fetchUnsplashImageUrl(keyword);

      return { success: true, imageUrl, keyword };
    } catch (err: any) {
      console.error("[AI Image] Error:", err);
      return { success: false, imageUrl: null, error: err?.message || "Failed to generate image" };
    }
  },
});

export const generateImagesForAllEvents = action({
  args: {},
  handler: async (ctx) => {
    const eventsWithoutImage = await ctx.runQuery(internal.events.getEventsWithoutImage);

    if (eventsWithoutImage.length === 0) {
      return { success: true, message: "All events already have images", count: 0 };
    }

    const model = getGeminiModel();
    let updated = 0;

    for (const event of eventsWithoutImage) {
      const keyword = model
        ? await getKeywordFromAI(model, event.name)
        : deriveKeyword(event.name);

      const imageUrl = await fetchUnsplashImageUrl(keyword);

      await ctx.runMutation(internal.events.setEventImageUrl, {
        eventId: event._id,
        imageUrl,
      });
      updated++;
    }

    return {
      success: true,
      message: `Generated images for ${updated} event${updated !== 1 ? "s" : ""}`,
      count: updated,
    };
  },
});