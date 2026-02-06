import { GoogleGenAI, Type } from "@google/genai";
import { ParsedData, PaymentProvider } from "../types";

export const analyzeSmsWithGemini = async (smsText: string): Promise<ParsedData | null> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the payment details from this SMS. If it is not a payment SMS, return null values.
      
      SMS: "${smsText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trxId: { type: Type.STRING, description: "The unique transaction ID" },
            amount: { type: Type.NUMBER, description: "The amount of money received" },
            sender: { type: Type.STRING, description: "The phone number or name of the sender" },
            provider: { type: Type.STRING, description: "One of: bKash, Nagad, Rocket, or Unknown" }
          },
          required: ["trxId", "amount", "sender", "provider"]
        }
      }
    });

    const result = response.text ? JSON.parse(response.text) : null;
    
    if (!result) return null;

    // Normalize Provider Enum
    let provider = PaymentProvider.UNKNOWN;
    const pUpper = result.provider?.toUpperCase() || "";
    if (pUpper.includes("BKASH")) provider = PaymentProvider.BKASH;
    else if (pUpper.includes("NAGAD")) provider = PaymentProvider.NAGAD;
    else if (pUpper.includes("ROCKET")) provider = PaymentProvider.ROCKET;

    return {
      trxId: result.trxId || null,
      amount: result.amount || null,
      sender: result.sender || null,
      provider: provider
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return null;
  }
};