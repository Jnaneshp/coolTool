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

/**
 * Fetch file content from a GitHub repository
 */
export async function fetchGitHubFileContent(
  repoOwner: string,
  repoName: string,
  filePath: string
): Promise<string | null> {
  try {
    // Clean up the file path - remove leading slashes if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // First attempt: Try the GitHub API
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${cleanPath}`;
    console.log("Fetching file content from:", apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      // GitHub returns file content as base64 encoded
      if (data.content && data.encoding === 'base64') {
        // Decode the base64 content
        const decodedContent = atob(data.content.replace(/\n/g, ''));
        return decodedContent;
      }
    }
    
    // Second attempt: Try the raw content URL for the default branch
    console.log("API request failed, trying raw content URL");
    
    // GitHub's raw content URL format
    const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${cleanPath}`;
    const rawResponse = await fetch(rawUrl);
    
    if (rawResponse.ok) {
      const textContent = await rawResponse.text();
      return textContent;
    }
    
    // Third attempt: Try with 'master' branch instead of 'main'
    const rawUrlMaster = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/master/${cleanPath}`;
    const masterResponse = await fetch(rawUrlMaster);
    
    if (masterResponse.ok) {
      const textContent = await masterResponse.text();
      return textContent;
    }
    
    console.error(`Failed to fetch file content for ${filePath}`);
    return null;
  } catch (error) {
    console.error("Error fetching file content:", error);
    return null;
  }
}

/**
 * Fetch repository information for analysis
 */
export async function fetchRepositoryInfo(repoOwner: string, repoName: string): Promise<any> {
  try {
    // Fetch basic repository information
    const repoUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
    const response = await fetch(repoUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch repository info: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching repository info:", error);
    return null;
  }
}

/**
 * Get all important files from a repository (limited by GitHub API constraints)
 */
export async function getRepositoryFiles(repoOwner: string, repoName: string, maxDepth = 2): Promise<string[]> {
  const files: string[] = [];
  
  // Helper function to fetch directory contents
  async function fetchDirContents(path: string = '', depth = 0) {
    if (depth > maxDepth) return; // Limit recursion depth
    
    try {
      const url = path 
        ? `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`
        : `https://api.github.com/repos/${repoOwner}/${repoName}/contents`;
      
      const response = await fetch(url);
      if (!response.ok) return;
      
      const contents = await response.json();
      
      // Process each item
      for (const item of contents) {
        if (item.type === 'file') {
          // Only include important files to avoid hitting API limits
          if (isImportantFile(item.name)) {
            files.push(item.path);
          }
        } else if (item.type === 'dir') {
          // For directories, recursively explore if they're important
          if (isImportantDir(item.name) || depth < 1) {
            await fetchDirContents(item.path, depth + 1);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching directory contents for ${path}:`, error);
    }
  }
  
  await fetchDirContents();
  return files;
}

/**
 * Check if a file is important enough to fetch
 */
function isImportantFile(filename: string): boolean {
  // Important file extensions
  const importantExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.yml', '.yaml', '.toml', '.css'];
  
  // Important specific files
  const importantFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'tailwind.config.js',
    'README.md',
    '.env.example',
    'Dockerfile',
    'docker-compose.yml',
    '.gitignore'
  ];
  
  // Check if it's a specific important file
  if (importantFiles.some(f => filename.toLowerCase() === f.toLowerCase())) {
    return true;
  }
  
  // Check if it has an important extension
  return importantExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

/**
 * Check if a directory is important enough to explore
 */
function isImportantDir(dirname: string): boolean {
  const importantDirs = ['src', 'app', 'components', 'pages', 'lib', 'utils', 'config', 'api', 'hooks'];
  return importantDirs.some(d => dirname.toLowerCase() === d.toLowerCase());
}

/**
 * Enhanced repository query function that analyzes the whole repo if needed
 */
export async function queryRepoWithGemini(
  question: string,
  repoName: string,
  repoOwner: string,
  repoDescription: string | null,
  fileContext?: string | null,
  fileStructure?: any[]
): Promise<string> {
  // Check if API key is available
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key is missing");
    return `I'm sorry, I can't answer your question right now. The Gemini API key is missing.`;
  }

  // Validate API key format
  if (!GEMINI_API_KEY.startsWith('AIza')) {
    console.error("Gemini API key appears to be invalid");
    return `I'm sorry, I can't answer your question right now. The Gemini API key appears to be invalid.`;
  }

  try {
    let specificFileContext = '';
    const lowercaseQuestion = question.toLowerCase();
    let repoAnalysisPerformed = false;
    
    // Check if request is for a specific entry point file that we should try multiple paths for
    const commonEntryFiles = [
      'app.jsx', 'app.js', 'app.tsx', 'app.ts', 'index.jsx', 'index.js', 'index.tsx', 'index.ts',
      'main.jsx', 'main.js', 'main.tsx', 'main.ts'
    ];
    
    const requestedEntryFile = commonEntryFiles.find(file => 
      lowercaseQuestion.includes(file.toLowerCase())
    );
    
    if (requestedEntryFile) {
      // Search for the file with various possible paths
      const possiblePaths = [
        requestedEntryFile,
        `src/${requestedEntryFile}`,
        `app/${requestedEntryFile}`,
        `${requestedEntryFile.replace('.', '/.')}`, // For Next.js app directory
        `pages/${requestedEntryFile}`,
        `src/pages/${requestedEntryFile}`,
        `src/components/${requestedEntryFile}`,
        `components/${requestedEntryFile}`
      ];
      
      let foundContent = false;
      
      for (const path of possiblePaths) {
        if (foundContent) break;
        
        const fileContent = await fetchGitHubFileContent(repoOwner, repoName, path);
        if (fileContent) {
          foundContent = true;
          
          // Get file extension for syntax highlighting
          const fileExt = path.split('.').pop()?.toLowerCase();
          let language = '';
          
          switch (fileExt) {
            case 'js': language = 'javascript'; break;
            case 'jsx': language = 'javascript'; break;
            case 'ts': language = 'typescript'; break;
            case 'tsx': language = 'typescript'; break;
            default: language = fileExt || ''; break;
          }
          
          specificFileContext += `\nFound file: ${path}:\n\`\`\`${language}\n${fileContent}\n\`\`\`\n`;
          repoAnalysisPerformed = true;
        }
      }
      
      if (!foundContent) {
        // If we didn't find the entry file, try to find any primary entry point
        specificFileContext += `\nI couldn't find ${requestedEntryFile} directly. Let me look for the main entry files in this repository:\n\n`;
        
        // Try to fetch important entry files that might be relevant
        const entryPoints = [
          'src/App.jsx', 'src/App.js', 'src/App.tsx', 'App.jsx', 'App.js',
          'src/index.js', 'src/index.jsx', 'src/index.ts', 'src/index.tsx',
          'src/main.js', 'src/main.jsx', 'src/main.ts', 'src/main.tsx',
          'src/app/page.tsx', 'src/pages/index.tsx', 'pages/index.js'
        ];
        
        for (const entryPoint of entryPoints) {
          const fileContent = await fetchGitHubFileContent(repoOwner, repoName, entryPoint);
          if (fileContent) {
            const fileExt = entryPoint.split('.').pop()?.toLowerCase();
            let language = '';
            
            switch (fileExt) {
              case 'js': language = 'javascript'; break;
              case 'jsx': language = 'javascript'; break;
              case 'ts': language = 'typescript'; break;
              case 'tsx': language = 'typescript'; break;
              default: language = fileExt || ''; break;
            }
            
            specificFileContext += `\nFound related entry file: ${entryPoint}:\n\`\`\`${language}\n${fileContent}\n\`\`\`\n`;
            repoAnalysisPerformed = true;
            break; // Just get the first match
          }
        }
        
        if (!repoAnalysisPerformed) {
          specificFileContext += `\nI couldn't find any standard entry files in this repository. Please specify a different file to view.\n`;
        }
      }
    }

    // Continue with repo-wide questions if we haven't found the specific file
    if (!repoAnalysisPerformed) {
      // Check if the question is about repository-wide functionality or architecture
      const isRepoWideQuestion = 
        lowercaseQuestion.includes('how does the repo') || 
        lowercaseQuestion.includes('how does this repo') ||
        lowercaseQuestion.includes('how does it work') ||
        lowercaseQuestion.includes('architecture') ||
        lowercaseQuestion.includes('implementation') ||
        lowercaseQuestion.includes('how is implemented') ||
        lowercaseQuestion.includes('fetching repo') || 
        lowercaseQuestion.includes('fetch repositories') ||
        lowercaseQuestion.includes('github api') ||
        lowercaseQuestion.includes('github integration');
      
      // If the question is about repo-wide functionality, fetch important files
      if (isRepoWideQuestion) {
        specificFileContext += "\nAnalyzing repository architecture...\n\n";
        
        // Get a list of important files in the repo
        const importantFiles = await getRepositoryFiles(repoOwner, repoName);
        
        // Fetch up to 5 important files that might be related to the question
        const filesToAnalyze = selectRelevantFiles(importantFiles, question);
        
        // Fetch the content of these files
        for (const filePath of filesToAnalyze) {
          const fileContent = await fetchGitHubFileContent(repoOwner, repoName, filePath);
          
          if (fileContent) {
            // Get file extension for syntax highlighting
            const fileExt = filePath.split('.').pop()?.toLowerCase();
            let language = '';
            
            switch (fileExt) {
              case 'js': language = 'javascript'; break;
              case 'jsx': language = 'javascript'; break;
              case 'ts': language = 'typescript'; break;
              case 'tsx': language = 'typescript'; break;
              case 'css': language = 'css'; break;
              case 'html': language = 'html'; break;
              case 'json': language = 'json'; break;
              case 'md': language = 'markdown'; break;
              default: language = fileExt || ''; break;
            }
            
            specificFileContext += `\nFile: ${filePath}:\n\`\`\`${language}\n${fileContent.length > 2000 ? fileContent.substring(0, 2000) + '...' : fileContent}\n\`\`\`\n`;
          }
        }
        
        repoAnalysisPerformed = true;
      }

      // If we haven't performed repo analysis, check for file-specific questions
      if (!repoAnalysisPerformed) {
        // Check if question is asking about a specific file
        // Enhanced pattern matching for file requests
        let requestedFilePaths: string[] = [];
        
        // Pattern 1: Explicit mentions of files
        const filePatterns = [
          // "show me the code in X", "what's in X", etc.
          /(?:what(?:'s| is)(?: in| inside)?|show(?: me)?|view|content(?:s)? of|code in|display) ['"]?([a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]+)['"]?/i,
          // Direct file path mentions
          /['"]([a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]+)['"]/g,
          // File path with extension at the end of a sentence or question
          /\b([a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]{1,10})\b(?:\?|\.|\s|$)/g,
        ];
        
        // Extract all potential file paths
        for (const pattern of filePatterns) {
          let match;
          if (pattern.global) {
            while ((match = pattern.exec(question)) !== null) {
              if (match[1] && !requestedFilePaths.includes(match[1])) {
                requestedFilePaths.push(match[1]);
              }
            }
          } else {
            match = question.match(pattern);
            if (match && match[1] && !requestedFilePaths.includes(match[1])) {
              requestedFilePaths.push(match[1]);
            }
          }
        }
        
        // Handle paths without directory structure explicitly mentioned
        
        // Special pattern for specific common files
        if (lowercaseQuestion.includes('globals.css') && !requestedFilePaths.some(p => p.includes('globals.css'))) {
          requestedFilePaths.push('src/app/globals.css');
        }
        
        if (lowercaseQuestion.includes('tailwind') && lowercaseQuestion.includes('config') 
            && !requestedFilePaths.some(p => p.includes('tailwind'))) {
          requestedFilePaths.push('tailwind.config.js');
        }
        
        // Pattern 2: Common file names when mentioned directly
        const commonFiles = [
          'package.json', 
          'tsconfig.json', 
          'next.config.js', 
          '.env.example',
          'README.md', 
          'tailwind.config.js',
          'src/app/globals.css',
          'src/app/page.tsx',
          'src/app/layout.tsx'
        ];
        
        for (const file of commonFiles) {
          const filename = file.split('/').pop()?.toLowerCase() || '';
          if (lowercaseQuestion.includes(filename.toLowerCase()) && !requestedFilePaths.includes(file)) {
            // Check various common directory structures for this file
            const possiblePaths = [
              file,                            // The original path
              filename,                        // Just the filename
              `src/${filename}`,               // src/filename
              `app/${filename}`,               // app/filename
              `src/app/${filename}`            // src/app/filename
            ];
            
            // Add the first path that's not already in our list
            for (const path of possiblePaths) {
              if (!requestedFilePaths.includes(path)) {
                requestedFilePaths.push(path);
                break;
              }
            }
          }
        }
        
        // If we detected main source code files or directories
        if (lowercaseQuestion.includes('main file') || 
            lowercaseQuestion.includes('entry point') ||
            lowercaseQuestion.includes('start file')) {
          // Add common entry point files
          const entryPoints = [
            'src/app/page.tsx',
            'src/app/layout.tsx',
            'src/pages/index.tsx',
            'src/index.js', 
            'src/index.ts', 
            'index.js',
            'index.ts',
            'src/main.js',
            'src/main.ts'
          ];
          for (const file of entryPoints) {
            if (!requestedFilePaths.includes(file)) {
              requestedFilePaths.push(file);
            }
          }
        }
        
        // Fetch file contents for detected paths
        
        // Fetch up to 3 files to avoid overwhelming the context
        const filesToFetch = requestedFilePaths.slice(0, 3);
        
        if (filesToFetch.length > 0) {
          console.log("Detected file request(s) for:", filesToFetch);
          
          for (const requestedFilePath of filesToFetch) {
            // Check if file exists in structure first to avoid unnecessary API calls
            let fileExists = false;
            if (fileStructure && fileStructure.length > 0) {
              fileExists = fileStructure.some(file => 
                file.type === 'file' && 
                (file.path === requestedFilePath || file.name === requestedFilePath || 
                file.path?.endsWith(requestedFilePath) || requestedFilePath.endsWith(file.name))
              );
            }
            
            // Try to fetch the file even if it's not in our structure list
            // since our file structure might be incomplete
            const fileContent = await fetchGitHubFileContent(repoOwner, repoName, requestedFilePath);
              
            if (fileContent) {
              // Determine language for syntax highlighting based on file extension
              const fileExt = requestedFilePath.split('.').pop()?.toLowerCase();
              let language = '';
              
              switch (fileExt) {
                case 'js': language = 'javascript'; break;
                case 'jsx': language = 'javascript'; break;
                case 'ts': language = 'typescript'; break;
                case 'tsx': language = 'typescript'; break;
                case 'css': language = 'css'; break;
                case 'html': language = 'html'; break;
                case 'json': language = 'json'; break;
                case 'md': language = 'markdown'; break;
                case 'py': language = 'python'; break;
                default: language = fileExt || ''; break;
              }
              
              specificFileContext += `\nFile content for ${requestedFilePath}:\n\`\`\`${language}\n${fileContent}\n\`\`\`\n`;
            } else {
              specificFileContext += `\nI tried to fetch the content of ${requestedFilePath}, but couldn't access it. It might not exist or require authentication.\n`;
            }
          }
        } else if (
          lowercaseQuestion.includes('show me') || 
          lowercaseQuestion.includes('what\'s in') || 
          lowercaseQuestion.includes('what is in')
        ) {
          // User is trying to view a file but we didn't detect a specific file path
          specificFileContext += `\nYou appear to be asking about a file, but I couldn't determine which specific file you want to see. Please specify the filename, for example: "Show me package.json" or "What's in src/app/page.tsx".\n`;
        }
      }
    }
    
    // Build file structure context if available
    let structureContext = '';
    if (fileStructure && fileStructure.length > 0) {
      structureContext = 'Repository structure:\n';
      fileStructure.forEach(file => {
        structureContext += `- ${file.type === 'dir' ? '📁' : '📄'} ${file.path || file.name}\n`;
      });
    }

    // Create prompt for Gemini
    const prompt = `
You are a helpful AI assistant that answers questions about a GitHub repository.
You have access to the repository's content and can analyze code files when needed.

Repository Name: ${repoName}
Repository Owner: ${repoOwner}
${repoDescription ? `Repository Description: ${repoDescription}` : ''}

${structureContext}
${fileContext ? `README Content:\n${fileContext}\n` : ''}
${specificFileContext}

User Question: ${question}

Please provide a helpful, accurate, and concise answer based on the information available.
If the user is asking about repository functionality or architecture, analyze the provided files to explain how the code works.
If the user is asking about a specific implementation detail, point to the relevant code sections.
If you don't have enough information, explain what additional files would be needed to answer the question.
`;

    // Log request details
    console.log("Making Gemini query with key:", GEMINI_API_KEY ? "Key exists" : "No key found");
    
    // Make request to Gemini API
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
          maxOutputTokens: 4096,
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
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    // Parse response data
    const data = await response.json();
    
    // Extract the generated text from the response
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!answer) {
      console.error('No content in Gemini response:', data);
      throw new Error('No content returned from Gemini API');
    }

    return answer;
  } catch (error) {
    console.error('Error querying Gemini:', error);
    return `I'm sorry, I couldn't process your question. There was an error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Select relevant files based on the question
 */
function selectRelevantFiles(files: string[], question: string): string[] {
  const lowerQuestion = question.toLowerCase();
  let relevantFiles: string[] = [];
  
  // Keywords to match against
  const fileMatchers: {[key: string]: string[]} = {
    'github api': ['github', 'api', 'fetch', 'request'],
    'repository': ['repository', 'repo', 'github'],
    'authentication': ['auth', 'login', 'signin', 'signup', 'clerk'],
    'ui components': ['component', 'button', 'card', 'layout'],
    'styling': ['css', 'style', 'tailwind'],
    'routing': ['route', 'page', 'navigation'],
    'api integration': ['api', 'fetch', 'request', 'axios'],
  };
  
  // Determine relevant categories
  let relevantCategories: string[] = [];
  for (const [category, keywords] of Object.entries(fileMatchers)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      relevantCategories.push(category);
    }
  }
  
  // Special case for GitHub API/repository fetching
  if (
    lowerQuestion.includes('github api') || 
    lowerQuestion.includes('fetch repo') || 
    lowerQuestion.includes('repository fetch') ||
    lowerQuestion.includes('github integration')
  ) {
    // Prioritize files that likely handle GitHub API
    const githubApiPriorities = [
      'github', 'api', 'fetch', 'request', 'repo', 'repository'
    ];
    
    // First, get all files that might be related to GitHub
    const potentialGithubFiles = files.filter(file => {
      const lowerFile = file.toLowerCase();
      return (
        lowerFile.includes('github') || 
        lowerFile.includes('api') || 
        lowerFile.includes('repo') ||
        lowerFile.includes('fetch') ||
        (lowerFile.includes('lib/') && (lowerFile.endsWith('.js') || lowerFile.endsWith('.ts')))
      );
    });
    
    // Sort by relevance
    relevantFiles = potentialGithubFiles.sort((a, b) => {
      const aScore = scoreFileRelevance(a, githubApiPriorities);
      const bScore = scoreFileRelevance(b, githubApiPriorities);
      return bScore - aScore;
    }).slice(0, 5);
  } else {
    // For other questions, find files that match the relevant categories
    relevantFiles = files
      .filter(file => {
        const lowerFile = file.toLowerCase();
        return relevantCategories.some(category => {
          const keywords = fileMatchers[category];
          return keywords.some(keyword => lowerFile.includes(keyword));
        });
      })
      .slice(0, 5);
  }
  
  // If we didn't find enough files, add some common important ones
  if (relevantFiles.length < 3) {
    // Add package.json for dependencies
    if (!relevantFiles.includes('package.json') && files.includes('package.json')) {
      relevantFiles.push('package.json');
    }
    
    // Add key source files
    for (const file of files) {
      if (
        (file.includes('/lib/') || file.includes('/utils/') || file.includes('/api/')) &&
        !relevantFiles.includes(file) &&
        relevantFiles.length < 5
      ) {
        relevantFiles.push(file);
      }
    }
  }
  
  return relevantFiles.slice(0, 5); // Limit to 5 files max
}

/**
 * Score file relevance based on keywords
 */
function scoreFileRelevance(filePath: string, keywords: string[]): number {
  const lowerFile = filePath.toLowerCase();
  return keywords.reduce((score, keyword) => {
    return score + (lowerFile.includes(keyword) ? 1 : 0);
  }, 0);
} 