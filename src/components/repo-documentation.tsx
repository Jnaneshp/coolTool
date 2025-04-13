"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Code, BookOpen, ArrowLeft, Sparkles, MessageSquare, FolderTree } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from 'react-markdown';
import { generateRepoDocumentation } from "@/lib/gemini";
import { RepoChat } from "@/components/repo-chat";
import { CodeVisualization } from "@/components/code-visualization";

interface RepoDocumentationProps {
  repoName: string;
  repoOwner: string;
  repoDescription?: string;
  onBack: () => void;
}

export function RepoDocumentation({ repoName, repoOwner, repoDescription, onBack }: RepoDocumentationProps) {
  const [loading, setLoading] = useState(true);
  const [readme, setReadme] = useState<string | null>(null);
  const [documentation, setDocumentation] = useState<string | null>(null);
  const [geminiDocs, setGeminiDocs] = useState<string | null>(null);
  const [generatingAIDocs, setGeneratingAIDocs] = useState(false);
  const [fileStructure, setFileStructure] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'readme' | 'docs' | 'ai-docs' | 'structure' | 'chat' | 'visualization'>('readme');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string | null>("");
  const { toast } = useToast();

  // Safe base64 decode function that works in browser environment
  const safeBase64Decode = (str: string) => {
    // Replace non-base64 characters and add padding if needed
    const base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/\s/g, '');
    
    try {
      // Use browser's atob or a polyfill
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(base64), (c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    } catch (error) {
      console.error('Error decoding base64:', error);
      return 'Failed to decode content';
    }
  };

  useEffect(() => {
    async function fetchRepositoryData() {
      setLoading(true);
      try {
        // Set up request headers with token if available
        const headers: HeadersInit = {};
        if (githubToken) {
          // Use token format (not Bearer) as per GitHub API docs
          headers.Authorization = `token ${githubToken}`;
          headers.Accept = 'application/vnd.github.v3+json';
          console.log("Using GitHub token for authentication in fetchRepositoryData");
        }

        // Fetch the README content
        const readmeResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/readme`, {
          headers
        });
        let readmeContent = "";
        
        if (readmeResponse.ok) {
          const readmeData = await readmeResponse.json();
          // GitHub returns README content as base64 encoded
          try {
            readmeContent = safeBase64Decode(readmeData.content);
            setReadme(readmeContent);
          } catch (error) {
            console.error("Failed to decode README content:", error);
            readmeContent = "No README found";
            setReadme("# Error Decoding README\n\nThere was an error decoding the README content for this repository.");
          }
        } else {
          console.error("Failed to fetch README");
          readmeContent = "No README found";
          setReadme("# No README found\n\nThis repository doesn't have a README file.");
        }

        // Fetch repository contents to analyze structure
        await fetchRepositoryStructure(repoOwner, repoName);
      } catch (error) {
        console.error("Error fetching repository data:", error);
        toast({
          title: "Error loading repository documentation",
          description: "Failed to load the documentation for this repository. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRepositoryData();
  }, [repoName, repoOwner, githubToken, toast]);

  useEffect(() => {
    if (githubToken) {
      toast({
        title: "GitHub Token Loaded",
        description: "Using your GitHub token for API requests. This will help avoid rate limits.",
      });
    }
  }, []);

  // New function to recursively fetch repository structure
  const fetchRepositoryStructure = async (owner: string, repo: string, path: string = '') => {
    try {
      // Set up request headers with token if available
      const headers: HeadersInit = {};
      if (githubToken) {
        // Use token format (not Bearer) as per GitHub API docs
        headers.Authorization = `token ${githubToken}`;
        headers.Accept = 'application/vnd.github.v3+json';
        console.log("Using GitHub token for authentication");
      }

      const contentsUrl = path 
        ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
        : `https://api.github.com/repos/${owner}/${repo}/contents`;
      
      console.log(`Fetching repository structure from: ${contentsUrl}`);
      
      const contentsResponse = await fetch(contentsUrl, { headers });
      
      if (!contentsResponse.ok) {
        const statusText = contentsResponse.statusText;
        const status = contentsResponse.status;
        console.error(`Failed to fetch repository contents (${status} ${statusText}) for path ${path}`);
        
        let responseText = '';
        try {
          responseText = await contentsResponse.text();
          console.error("Error response:", responseText);
        } catch (e) {
          console.error("Could not read error response text");
        }
        
        if (status === 403) {
          // Check if it's a rate limit issue
          if (responseText.includes('rate limit') || responseText.includes('API rate limit exceeded')) {
            toast({
              title: "GitHub API Rate Limit Exceeded",
              description: "You've reached GitHub's API limit. Please try again later or check your token.",
              variant: "destructive",
            });
            // Set an error state in the file structure
            setFileStructure([{
              message: "GitHub API rate limit exceeded",
              documentation_url: "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
            }]);
          } else if (responseText.includes('Bad credentials') || responseText.includes('authorization')) {
            toast({
              title: "GitHub Authentication Error",
              description: "Your GitHub token was rejected. Please check it and try again.",
              variant: "destructive",
            });
            setFileStructure([{
              message: "GitHub Authentication Error: Invalid Token",
              documentation_url: "https://docs.github.com/rest/overview/other-authentication-methods#via-oauth-and-personal-access-tokens"
            }]);
          } else {
            toast({
              title: "Repository Access Error",
              description: "This repository might be private or require authentication.",
              variant: "destructive",
            });
          }
        } else if (status === 404) {
          toast({
            title: "Repository Not Found",
            description: `Could not find repository ${owner}/${repo}. Please check the name and try again.`,
            variant: "destructive",
          });
          setFileStructure([{
            message: `Repository ${owner}/${repo} not found`
          }]);
        } else {
          toast({
            title: `GitHub API Error (${status})`,
            description: "Failed to fetch repository data. Please try again later.",
            variant: "destructive",
          });
        }
        
        return;
      }
      
      const contentsData = await contentsResponse.json();
      
      // For the root level, directly set the file structure
      if (!path) {
        setFileStructure(contentsData);
        generateBasicDocumentation(contentsData);
        
        // Process some key directories like src, app, or pages (common in web projects)
        const importantDirs = contentsData.filter((item: any) => 
          item.type === 'dir' && 
          ['src', 'app', 'pages', 'components'].includes(item.name)
        );
        
        // Recursively fetch important directories (limited to avoid API rate limits)
        for (const dir of importantDirs.slice(0, 2)) {
          await fetchDirectoryContents(owner, repo, dir.path);
        }
      }
    } catch (error) {
      console.error("Error fetching repository structure:", error);
      toast({
        title: "Error Loading Repository",
        description: "Failed to fetch repository data. Check if the repository exists and is public.",
        variant: "destructive",
      });
    }
  };

  // Helper function to fetch directory contents and update files
  const fetchDirectoryContents = async (owner: string, repo: string, path: string) => {
    try {
      // Set up request headers with token if available
      const headers: HeadersInit = {};
      if (githubToken) {
        // Use token format (not Bearer) as per GitHub API docs
        headers.Authorization = `token ${githubToken}`;
        headers.Accept = 'application/vnd.github.v3+json';
      }

      const dirUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const response = await fetch(dirUrl, { headers });
      
      if (!response.ok) {
        // Just return silently for sub-directory failures to avoid multiple error messages
        if (response.status === 403) {
          console.warn("GitHub API rate limit may have been exceeded");
        }
        return;
      }
      
      const dirContents = await response.json();
      
      // Update file structure with these new contents
      setFileStructure(prevFiles => {
        // Create a deep copy to avoid mutation
        const newFiles = [...prevFiles];
        
        // Find the directory in the existing structure
        const dirIndex = newFiles.findIndex(file => file.path === path);
        
        if (dirIndex !== -1) {
          // Replace the directory with its contents
          newFiles.splice(dirIndex, 1, ...dirContents);
        } else {
          // Just append the contents
          newFiles.push(...dirContents);
        }
        
        return newFiles;
      });
      
      // Recursively fetch subdirectories (limited depth to avoid API rate limits)
      const subdirs = dirContents.filter((item: any) => item.type === 'dir');
      for (const subdir of subdirs.slice(0, 2)) {
        await fetchDirectoryContents(owner, repo, subdir.path);
      }
    } catch (error) {
      console.error(`Error fetching directory contents for ${path}:`, error);
    }
  };

  // Generate AI documentation using Gemini
  const handleGenerateAIDocs = async () => {
    if (!readme) return;
    
    setGeneratingAIDocs(true);
    try {
      const aiDocs = await generateRepoDocumentation(
        repoName,
        repoDescription || null,
        readme || "No README content available",
        fileStructure
      );
      
      setGeminiDocs(aiDocs);
      setActiveTab('ai-docs');
      
      toast({
        title: "AI Documentation Generated",
        description: "Gemini has created documentation for this repository.",
      });
    } catch (error) {
      console.error("Error generating AI documentation:", error);
      toast({
        title: "Error Generating Documentation",
        description: "Failed to generate AI documentation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAIDocs(false);
    }
  };

  // Simple documentation generation based on file structure
  const generateBasicDocumentation = (files: any[]) => {
    // Count file types
    const fileTypes = files.reduce((acc: Record<string, number>, file: any) => {
      if (file.type === "file") {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        acc[extension] = (acc[extension] || 0) + 1;
      }
      return acc;
    }, {});

    // Identify potential project type
    let projectType = "Unknown";
    
    if (files.some(f => f.name === "package.json")) {
      projectType = "JavaScript/Node.js";
    } else if (files.some(f => f.name === "Cargo.toml")) {
      projectType = "Rust";
    } else if (files.some(f => f.name.endsWith(".py"))) {
      projectType = "Python";
    } else if (files.some(f => f.name.endsWith(".java"))) {
      projectType = "Java";
    } else if (files.some(f => f.name === "go.mod")) {
      projectType = "Go";
    }

    // Find key directories
    const hasSourceCode = files.some(f => ["src", "lib", "app"].includes(f.name) && f.type === "dir");
    const hasTests = files.some(f => ["test", "tests", "__tests__", "spec"].includes(f.name) && f.type === "dir");
    const hasDocs = files.some(f => ["docs", "documentation", "wiki"].includes(f.name) && f.type === "dir");
    const hasScripts = files.some(f => ["scripts", "tools"].includes(f.name) && f.type === "dir");

    // Generate documentation text
    const doc = `# ${repoName} Documentation

## Project Overview

This appears to be a **${projectType}** project maintained by **${repoOwner}**.

## Project Structure Analysis

${hasSourceCode ? "✅ Has organized source code directory" : "❌ No standard source code directory found"}
${hasTests ? "✅ Includes test directory" : "❌ No test directory found"}
${hasDocs ? "✅ Has dedicated documentation" : "❌ No dedicated documentation directory"}
${hasScripts ? "✅ Contains scripts/tools" : "❌ No scripts directory found"}

## File Types

${Object.entries(fileTypes)
  .sort((a, b) => b[1] - a[1])
  .map(([ext, count]) => `- **${ext}**: ${count} file${count > 1 ? 's' : ''}`)
  .join('\n')}

## Getting Started

Based on the project structure, here's how you might get started with this repository:

${
  projectType === "JavaScript/Node.js" 
    ? "```bash\n# Install dependencies\nnpm install\n\n# Run the project\nnpm start\n```" 
    : projectType === "Python"
    ? "```bash\n# Set up virtual environment\npython -m venv venv\nsource venv/bin/activate  # On Windows: venv\\Scripts\\activate\n\n# Install dependencies\npip install -r requirements.txt\n```"
    : projectType === "Rust"
    ? "```bash\n# Build the project\ncargo build\n\n# Run the project\ncargo run\n```"
    : projectType === "Java"
    ? "```bash\n# If it's a Maven project\nmvn install\nmvn exec:java\n```"
    : projectType === "Go"
    ? "```bash\n# Run the project\ngo run .\n```"
    : "Check the README for specific instructions on how to set up and run this project."
}

## Notes

This documentation was automatically generated based on the repository structure. For more accurate information, please refer to the README and any official documentation included in the repository.
`;

    setDocumentation(doc);
  };

  // Handle file click in visualization
  const handleFileClick = (filePath: string) => {
    if (filePath) {
      // Set selected file
      setSelectedFile(filePath);
      
      // Set up tab to show file content and trigger a fetch
      setActiveTab('chat');
      
      // Trigger a chat message to show the file content
      toast({
        title: "File Selected",
        description: `Fetching content for ${filePath}. You can now ask questions about this file.`,
      });
    }
  };

  // Render hierarchical file structure
  const renderStructureTree = () => {
    // Process flat file structure into hierarchical data
    const buildHierarchy = () => {
      if (!fileStructure || fileStructure.length === 0) return null;
      
      const root = {
        path: '',
        name: repoName,
        type: 'dir' as const,
        children: [] as any[]
      };
      
      // Convert flat list to hierarchical structure
      fileStructure.forEach((file: any) => {
        const pathParts = (file.path || file.name).split('/');
        let currentLevel = root;
        
        // Create folder hierarchy
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderName = pathParts[i];
          let folder = currentLevel.children?.find(child => 
            child.type === 'dir' && child.name === folderName
          );
          
          if (!folder) {
            folder = {
              path: pathParts.slice(0, i + 1).join('/'),
              name: folderName,
              type: 'dir',
              children: []
            };
            currentLevel.children?.push(folder);
          }
          
          currentLevel = folder;
        }
        
        // Add the file to the current level
        const fileName = pathParts[pathParts.length - 1];
        if (pathParts.length > 1 || file.type === 'file') {
          currentLevel.children?.push({
            path: file.path || file.name,
            name: fileName,
            type: file.type,
            children: file.type === 'dir' ? [] : undefined
          });
        }
      });
      
      return root;
    };
    
    // Recursive function to render tree
    const renderTreeNode = (node: any, level = 0, isLastChild = false) => {
      const paddingLeft = level * 20;
      
      return (
        <div key={node.path || node.name} className="relative">
          <div className="flex items-center h-7">
            {/* Connecting lines */}
            {level > 0 && (
              <div className="absolute" style={{ left: `${(level - 1) * 20 + 8}px`, top: 0 }}>
                {isLastChild ? (
                  <span className="inline-block w-[12px] h-[14px] border-l-2 border-b-2 border-gray-300 rounded-bl"></span>
                ) : (
                  <span className="inline-block w-[12px] h-[28px] border-l-2 border-b-2 border-gray-300 rounded-bl"></span>
                )}
              </div>
            )}
            
            {/* Node content */}
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              {node.type === 'dir' ? (
                <>
                  <svg className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span className="font-medium">{node.name}/</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span>{node.name}</span>
                </>
              )}
            </div>
          </div>
          
          {node.children && node.children.length > 0 && (
            <div className="relative">
              {node.children
                .sort((a: any, b: any) => {
                  // Directories first, then files
                  if (a.type !== b.type) {
                    return a.type === 'dir' ? -1 : 1;
                  }
                  // Alphabetical order
                  return a.name.localeCompare(b.name);
                })
                .map((child: any, index: number, array: any[]) => 
                  renderTreeNode(
                    child, 
                    level + 1, 
                    index === array.length - 1
                  )
                )}
            </div>
          )}
        </div>
      );
    };
    
    const hierarchy = buildHierarchy();
    
    if (!hierarchy) {
      return (
        <div className="text-muted-foreground">No files found in this repository.</div>
      );
    }
    
    return (
      <div className="max-h-[550px] overflow-auto pl-4 pr-2 py-2">
        {hierarchy.children
          .sort((a: any, b: any) => {
            // Directories first, then files  
            if (a.type !== b.type) {
              return a.type === 'dir' ? -1 : 1;
            }
            // Alphabetical order
            return a.name.localeCompare(b.name);
          })
          .map((child: any, index: number, array: any[]) => 
            renderTreeNode(child, 0, index === array.length - 1)
          )}
      </div>
    );
  };

  // Add a function to validate GitHub tokens
  const validateGitHubToken = async (token: string) => {
    try {
      // Create headers with the token
      const headers: HeadersInit = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      // Test the token by checking rate limits
      console.log("Testing GitHub token...");
      const response = await fetch('https://api.github.com/rate_limit', { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log("GitHub token validated successfully. Rate limit:", data.rate);
        toast({
          title: "GitHub Token Valid",
          description: `Token accepted. Rate limit: ${data.rate.remaining}/${data.rate.limit} requests.`,
        });
        return true;
      } else {
        const errorText = await response.text();
        console.error("GitHub token validation failed:", response.status, errorText);
        
        if (response.status === 401) {
          toast({
            title: "Invalid GitHub Token",
            description: "The token was rejected by GitHub. Please check it and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "GitHub API Error",
            description: `Error validating token: ${response.status} ${response.statusText}`,
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error) {
      console.error("Error validating GitHub token:", error);
      toast({
        title: "Token Validation Error",
        description: "Could not validate your GitHub token due to a network error.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add token validation before applying it
  const handleApplyToken = async () => {
    if (!githubToken) {
      toast({
        title: "No Token Provided",
        description: "Please enter a GitHub Personal Access Token first.",
        variant: "destructive",
      });
      return;
    }
    
    // Clean the token (remove any whitespace)
    const cleanToken = githubToken.trim();
    setGithubToken(cleanToken);
    
    // Validate the token before using it
    const isValid = await validateGitHubToken(cleanToken);
    
    if (isValid) {
      // Refresh repository data with the valid token
      refreshRepositoryData(cleanToken);
    }
  };

  // Create a separate function for refreshing data to avoid code duplication
  const refreshRepositoryData = async (token: string) => {
    setLoading(true);
    try {
      // Fetch the README content with token
      const headers: HeadersInit = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      console.log(`Fetching README for ${repoOwner}/${repoName} with token`);
      const readmeResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/readme`, {
        headers
      });
      
      let readmeContent = "";
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        try {
          readmeContent = safeBase64Decode(readmeData.content);
          setReadme(readmeContent);
        } catch (error) {
          console.error("Failed to decode README content:", error);
          setReadme("# Error Decoding README\n\nThere was an error decoding the README content for this repository.");
        }
      } else {
        console.error("Failed to fetch README:", readmeResponse.status, readmeResponse.statusText);
        setReadme("# No README found\n\nThis repository doesn't have a README file.");
      }

      // Fetch repository structure
      await fetchRepositoryStructure(repoOwner, repoName);
    } catch (error) {
      console.error("Error fetching repository data:", error);
      toast({
        title: "Error loading repository documentation",
        description: "Failed to load the documentation for this repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading repository documentation...</p>
      </div>
    );
  }

  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> {repoName} Documentation
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Repositories
          </Button>
        </div>
        <CardDescription>
          Analyze and explore documentation for this repository
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Token input UI */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={githubToken || ''}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="GitHub Personal Access Token (optional)"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button 
              onClick={handleApplyToken}
              size="sm"
            >
              Apply Token
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Avoid GitHub API rate limits by adding your token.
          </p>
        </div>

        {!geminiDocs && (
          <div className="mb-4">
            <Button
              onClick={handleGenerateAIDocs}
              disabled={generatingAIDocs}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {generatingAIDocs ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating AI Documentation...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Documentation with Gemini AI
                </>
              )}
            </Button>
          </div>
        )}

        <div className="flex border-b mb-4 overflow-x-auto">
          <Button
            variant={activeTab === 'readme' ? "default" : "ghost"}
            className="rounded-b-none border-b-2 border-transparent"
            onClick={() => setActiveTab('readme')}
          >
            <FileText className="h-4 w-4 mr-2" /> README
          </Button>
          {geminiDocs && (
            <Button
              variant={activeTab === 'ai-docs' ? "default" : "ghost"}
              className="rounded-b-none border-b-2 border-transparent"
              onClick={() => setActiveTab('ai-docs')}
            >
              <Sparkles className="h-4 w-4 mr-2" /> Gemini Docs
            </Button>
          )}
          <Button
            variant={activeTab === 'docs' ? "default" : "ghost"}
            className="rounded-b-none border-b-2 border-transparent"
            onClick={() => setActiveTab('docs')}
          >
            <BookOpen className="h-4 w-4 mr-2" /> Basic Docs
          </Button>
          <Button
            variant={activeTab === 'structure' ? "default" : "ghost"}
            className="rounded-b-none border-b-2 border-transparent"
            onClick={() => setActiveTab('structure')}
          >
            <Code className="h-4 w-4 mr-2" /> Structure
          </Button>
          <Button
            variant={activeTab === 'visualization' ? "default" : "ghost"}
            className="rounded-b-none border-b-2 border-transparent"
            onClick={() => setActiveTab('visualization')}
          >
            <FolderTree className="h-4 w-4 mr-2" /> Visualization
          </Button>
          <Button
            variant={activeTab === 'chat' ? "default" : "ghost"}
            className="rounded-b-none border-b-2 border-transparent"
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Chat
          </Button>
        </div>

        {activeTab === 'readme' && readme && (
          <div className="prose dark:prose-invert prose-sm max-w-none markdown-content">
            <ReactMarkdown>{readme}</ReactMarkdown>
          </div>
        )}

        {activeTab === 'ai-docs' && geminiDocs && (
          <div className="prose dark:prose-invert prose-sm max-w-none markdown-content">
            <ReactMarkdown>{geminiDocs}</ReactMarkdown>
          </div>
        )}

        {activeTab === 'docs' && documentation && (
          <div className="prose dark:prose-invert prose-sm max-w-none markdown-content">
            <ReactMarkdown>{documentation}</ReactMarkdown>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <h3>Repository Structure</h3>
            <div className="mt-4">
              {renderStructureTree()}
            </div>
          </div>
        )}

        {activeTab === 'visualization' && (
          <CodeVisualization
            repoName={repoName}
            repoOwner={repoOwner}
            fileStructure={fileStructure}
            onFileClick={handleFileClick}
          />
        )}

        {activeTab === 'chat' && (
          <RepoChat 
            repoName={repoName}
            repoOwner={repoOwner}
            repoDescription={repoDescription}
            repoReadme={readme || undefined}
            fileStructure={fileStructure}
            selectedFile={selectedFile}
          />
        )}
      </CardContent>
    </Card>
  );
} 