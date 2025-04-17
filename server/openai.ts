import OpenAI from "openai";
import { Lead } from "@shared/schema";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Generates embeddings for a given text
 * @param text The text to generate embeddings for
 * @returns A vector of embeddings
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

/**
 * Calculates cosine similarity between two vectors
 * @param vecA First vector
 * @param vecB Second vector
 * @returns Similarity score between 0 and 1
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Score profiles for ideal customer fit
 * @param profiles Object of candidate profile embeddings
 * @param idealCustomerEmbedding Embedding vector for the ideal customer profile
 * @returns Sorted list of profiles with scores
 */
export function scoreProfiles(
  profiles: Record<string, number[]>,
  idealCustomerEmbedding: number[]
): { id: string; score: number }[] {
  const scores = Object.entries(profiles).map(([id, embedding]) => ({
    id,
    score: cosineSimilarity(embedding, idealCustomerEmbedding)
  }));
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Creates an ideal customer profile embedding based on industry and use case
 * @param industry Industry of the ideal customer
 * @param useCase Use case description
 * @returns Embedding vector
 */
export async function createIdealCustomerProfile(
  industry: string,
  useCase: string
): Promise<number[]> {
  const prompt = `Ideal customer profile for ${industry} with use case: ${useCase}`;
  return generateEmbeddings(prompt);
}

// Category thresholds for lead scoring
const SCORE_THRESHOLDS = {
  high: 0.75,
  medium: 0.5
};

/**
 * Scores a lead based on their profile data compared to event-specific criteria
 * @param lead The lead to score
 * @param eventCriteria Optional event-specific criteria for scoring, falls back to default if not provided
 * @returns Score category (high, medium, low) and explanation
 */
export async function scoreLead(
  lead: Lead, 
  eventCriteria?: string
): Promise<{ 
  score: "high" | "medium" | "low"; 
  explanation: string;
  similarityScore: number;
}> {
  try {
    // Extract relevant data from the lead
    const leadProfile = `
      Name: ${lead.firstName} ${lead.lastName}
      Title: ${lead.title || "Unknown"}
      Company: ${lead.company || "Unknown"}
      Email: ${lead.email}
      Notes: ${lead.notes || ""}
    `;
    
    // Use event-specific criteria if provided, otherwise use default
    const idealCustomerDescription = eventCriteria || `
      A decision maker (Director level or above) from a mid to large-sized company
      in the technology, finance, or healthcare industries. They have budget authority
      and are actively looking for solutions to improve their business operations.
      They're interested in innovation and improving efficiency.
    `;
    
    // Generate embeddings for both profiles
    const leadEmbedding = await generateEmbeddings(leadProfile);
    const idealEmbedding = await generateEmbeddings(idealCustomerDescription);
    
    // Calculate similarity score
    const similarity = cosineSimilarity(leadEmbedding, idealEmbedding);
    
    // Determine score category
    let scoreCategory: "high" | "medium" | "low";
    if (similarity >= SCORE_THRESHOLDS.high) {
      scoreCategory = "high";
    } else if (similarity >= SCORE_THRESHOLDS.medium) {
      scoreCategory = "medium";
    } else {
      scoreCategory = "low";
    }
    
    // Generate an explanation using OpenAI
    const prompt = `
      I'm analyzing a potential sales lead with the following profile:
      ${leadProfile}
      
      Compare this to our ideal customer profile criteria:
      ${idealCustomerDescription}
      
      Based on the profile data, explain in 2-3 short sentences why this lead is scored as "${scoreCategory}" quality (similarity score: ${Math.round(similarity * 100)}%).
      Focus on specific attributes like job title, company, and potential interest signals.
      Your response should be 2-3 sentences only, and please be constructive even for low-scored leads.
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.7
    });
    
    let explanation = response.choices[0].message.content?.trim() || "No explanation available";
    
    // Ensure the explanation isn't too long
    if (explanation.length > 200) {
      explanation = explanation.substring(0, 197) + "...";
    }
    
    return {
      score: scoreCategory,
      explanation,
      similarityScore: similarity
    };
  } catch (error) {
    console.error("Error scoring lead:", error);
    return {
      score: "medium", // Default to medium if there's an error
      explanation: "Lead could not be automatically scored. Please review manually.",
      similarityScore: 0.5
    };
  }
}