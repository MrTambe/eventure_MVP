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
      let keyword = "event";
      const model = getGeminiModel();

      if (model) {
        try {
          const prompt = `Generate a single short search keyword (1-2 words) for finding a relevant stock photo for an event called "${args.eventName}". Only respond with the keyword, nothing else. Examples: "hackathon" → "coding", "sports meet" → "athletics", "cultural fest" → "festival", "workshop" → "classroom", "seminar" → "conference".`;

          const result = await model.generateContent(prompt);
          const response = result.response;
          const content = response.text()?.trim();
          if (content) {
            keyword = content.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "event";
          }
        } catch {
          keyword = args.eventName.split(/\s+/).slice(0, 2).join(" ").toLowerCase() || "event";
        }
      } else {
        keyword = args.eventName.split(/\s+/).slice(0, 2).join(" ").toLowerCase() || "event";
      }

      const hash = Array.from(keyword).reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const picsumUrl = `https://picsum.photos/seed/${encodeURIComponent(keyword + hash)}/800/400`;

      return { success: true, imageUrl: picsumUrl, keyword };
    } catch (err: any) {
      console.error("[AI Image] Error:", err);
      return { success: false, imageUrl: null, error: err?.message || "Failed to generate image" };
    }
  },
});

export const generateImagesForAllEvents = action({
  args: {},
  handler: async (ctx) => {
    // Get all events without images
    const eventsWithoutImage = await ctx.runQuery(internal.events.getEventsWithoutImage);

    if (eventsWithoutImage.length === 0) {
      return { success: true, message: "All events already have images", count: 0 };
    }

    const model = getGeminiModel();
    let updated = 0;

    for (const event of eventsWithoutImage) {
      let keyword = "event";

      if (model) {
        try {
          const prompt = `Generate a single short search keyword (1-2 words) for finding a relevant stock photo for an event called "${event.name}". Only respond with the keyword, nothing else. Examples: "hackathon" → "coding", "sports meet" → "athletics", "cultural fest" → "festival", "workshop" → "classroom", "seminar" → "conference".`;

          const result = await model.generateContent(prompt);
          const response = result.response;
          const content = response.text()?.trim();
          if (content) {
            keyword = content.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "event";
          }
        } catch {
          keyword = event.name.split(/\s+/).slice(0, 2).join(" ").toLowerCase() || "event";
        }
      } else {
        keyword = event.name.split(/\s+/).slice(0, 2).join(" ").toLowerCase() || "event";
      }

      const hash = Array.from(keyword).reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
      const picsumUrl = `https://picsum.photos/seed/${encodeURIComponent(keyword + hash)}/800/400`;

      await ctx.runMutation(internal.events.setEventImageUrl, {
        eventId: event._id,
        imageUrl: picsumUrl,
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