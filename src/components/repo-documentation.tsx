"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Code, BookOpen, ArrowLeft, Sparkles, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from 'react-markdown';
import { generateRepoDocumentation } from "@/lib/gemini";
import { RepoChat } from "@/components/repo-chat";

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
  const [activeTab, setActiveTab] = useState<'readme' | 'docs' | 'ai-docs' | 'structure' | 'chat'>('readme');
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
        // Fetch the README content
        const readmeResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/readme`);
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
  }, [repoName, repoOwner, toast]);

  // New function to recursively fetch repository structure
  const fetchRepositoryStructure = async (owner: string, repo: string, path: string = '') => {
    try {
      const contentsUrl = path 
        ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
        : `https://api.github.com/repos/${owner}/${repo}/contents`;
      
      const contentsResponse = await fetch(contentsUrl);
      
      if (!contentsResponse.ok) {
        console.error(`Failed to fetch repository contents for path ${path}`);
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
    }
  };

  // Helper function to fetch directory contents and update files
  const fetchDirectoryContents = async (owner: string, repo: string, path: string) => {
    try {
      const dirUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const response = await fetch(dirUrl);
      
      if (!response.ok) {
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
            <ul className="space-y-2 mt-4">
              {fileStructure.map((file) => (
                <li key={file.path} className="flex items-center">
                  {file.type === 'dir' ? (
                    <span className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <span className="font-medium">{file.name}/</span>
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      {file.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'chat' && (
          <RepoChat 
            repoName={repoName}
            repoOwner={repoOwner}
            repoDescription={repoDescription}
            repoReadme={readme || undefined}
            fileStructure={fileStructure}
          />
        )}
      </CardContent>
    </Card>
  );
} 