// Simple utility functions for interacting with the Gemini API (free tier)
import { env } from "@/config/env";

// Trim any whitespace from the API key
const GEMINI_API_KEY = env.GEMINI_API_KEY.trim();
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

/**
 * Generate repository documentation using Gemini AI
 * This uses the free tier of the Gemini API
 */
export async function generateRepoDocumentation(
  repoName: string,
  repoDescription: string | null,
  readmeContent: string,
  fileStructure: any[]
): Promise<string> {
  // Check if API key is available
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key is missing");
    return `# Documentation Generation Failed

The Gemini API key is missing. Please add the NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.`;
  }

  // Validate API key format (should be a Google API key format)
  if (!GEMINI_API_KEY.startsWith('AIza')) {
    console.error("Gemini API key appears to be invalid");
    return `# Documentation Generation Failed

The Gemini API key appears to be invalid. Google API keys typically start with 'AIza'.`;
  }

  try {
    // Create a structured file list with file types and names
    const fileList = fileStructure.map(file => {
      const fileType = file.type === 'dir' ? 'Directory' : 'File';
      return `${fileType}: ${file.name}`;
    }).join('\n');
    
    // Get file extensions to identify languages used
    const fileExtensions = fileStructure
      .filter(file => file.type === 'file' && file.name.includes('.'))
      .map(file => file.name.split('.').pop());
    
    // Count occurrences of each extension
    const extensionCounts: {[key: string]: number} = {};
    fileExtensions.forEach(ext => {
      if (ext) {
        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
      }
    });
    
    // Format the extension counts
    const extensionStats = Object.entries(extensionCounts)
      .map(([ext, count]) => `${ext}: ${count} file(s)`)
      .join('\n');

    // Truncate readme and file list if too long
    const truncatedReadme = readmeContent.length > 2000 
      ? readmeContent.substring(0, 2000) + '... (truncated)'
      : readmeContent;
    
    const truncatedFileList = fileList.length > 1000
      ? fileList.substring(0, 1000) + '... (truncated)'
      : fileList;

    // Create prompt for Gemini
    const prompt = `
Please analyze this GitHub repository and create comprehensive documentation for it.

Repository Name: ${repoName}
${repoDescription ? `Repository Description: ${repoDescription}` : ''}

File Types Summary:
${extensionStats}

README Content:
${truncatedReadme}

File Structure (partial):
${truncatedFileList}

Please generate a detailed documentation that includes:
1. An explanation of what this project does
2. The main technologies and languages used
3. Project architecture and structure overview
4. How to set up and use the project
5. Key features and components
6. Any notable patterns or best practices used

Format the documentation in Markdown.
`;

    // Log request details
    console.log("Making Gemini API request with key:", GEMINI_API_KEY ? "Key exists" : "No key found");
    console.log("API URL:", `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 5)}...`);
    
    // Make request to Gemini API (free tier)
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        }
      })
    });

    // Log response status
    console.log("Gemini API response status:", response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        errorMessage = `${errorMessage}: ${JSON.stringify(errorData)}`;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    // Parse response data
    let data;
    try {
      data = await response.json();
      console.log("Gemini API response received:", data ? "Data received" : "No data");
    } catch (e) {
      console.error('Error parsing response JSON:', e);
      throw new Error('Failed to parse Gemini API response');
    }
    
    // Extract the generated text from the response
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedContent) {
      console.error('No content in Gemini response:', data);
      throw new Error('No content returned from Gemini API');
    }

    return generatedContent;
  } catch (error) {
    console.error('Error generating documentation with Gemini:', error);
    return `# Documentation Generation Failed

Unfortunately, we couldn't generate documentation using Gemini API. This might be due to:
- API rate limits (the free tier has usage limitations)
- Network issues
- Content filtering restrictions

Error details: ${error instanceof Error ? error.message : String(error)}

You can still view the repository structure and README in the other tabs.`;
  }
} 