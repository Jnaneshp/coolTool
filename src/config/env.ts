/**
 * Environment variables accessible in client components
 * Next.js makes env vars available to the browser if they start with NEXT_PUBLIC_
 */

export const env = {
  // Gemini API
  GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
}; 