"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Bot, User, FileCode, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { queryRepoWithGemini } from "@/lib/gemini";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RepoChatProps {
  repoName: string;
  repoOwner: string;
  repoDescription?: string;
  repoReadme?: string;
  fileStructure?: any[];
  selectedFile?: string | null;
}

export function RepoChat({ repoName, repoOwner, repoDescription, repoReadme, fileStructure, selectedFile }: RepoChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize messages once or when selectedFile changes
  useEffect(() => {
    const initialMessage = {
      role: 'assistant' as const,
      content: selectedFile 
        ? `Hi there! I'm your repository assistant for **${repoName}**. You've selected the file **${selectedFile}**. What would you like to know about this file?`
        : `Hi there! I'm your repository assistant for **${repoName}**. Ask me anything about this repository, and I'll try to help.\n\nYou can ask me to show code from specific files by saying:\n- "Show me the code in [filename]"\n- "What's in [filename]"\n- "Display [filename]"`,
      timestamp: new Date()
    };

    // Only reset messages if there are none yet or if selectedFile changes
    setMessages(prev => {
      if (prev.length === 0 || (selectedFile && prev[0].content.indexOf(selectedFile) === -1)) {
        return [initialMessage];
      }
      return prev;
    });
    
    // If there's a selected file, prepare a query to show it
    if (selectedFile && messages.length === 0) {
      setInput(`Show me the code in ${selectedFile}`);
    }
  }, [repoName, selectedFile, messages.length]);

  // Extract file names from fileStructure on component mount
  useEffect(() => {
    if (fileStructure && fileStructure.length > 0) {
      const files = fileStructure
        .filter(file => file.type === 'file')
        .map(file => file.name);
      setFileList(files);
    }
  }, [fileStructure]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get context from readme
      const context = repoReadme ? repoReadme : null;
      
      // Check if this is a file access request
      const fileAccessRegex = /(show|display|what'?s in|content of) ['"]?(.+?\.[\w]+)['"]?/i;
      const fileAccessMatch = input.match(fileAccessRegex);
      
      // Check for specific patterns that might indicate requesting a file with square brackets
      const containsAuthRoutePatterns = input.toLowerCase().includes('sign-in') || 
        input.toLowerCase().includes('auth') || 
        input.toLowerCase().includes('[[...') || 
        input.toLowerCase().includes('route') || 
        input.includes('(auth)');
        
      // Handle special case for files that might be inaccessible
      if (fileAccessMatch && containsAuthRoutePatterns) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: `I'm sorry, I don't have access to the content of the file you requested. Files in Next.js route directories with special naming patterns like \`(auth)\` or files with square brackets (\`[[...]]\`) might not be accessible through the GitHub API due to:

1. GitHub API limitations with special characters in paths
2. Authentication requirements for accessing certain repository content
3. The file might be part of a private directory or require special permissions

If you'd like to see this file, you would need to clone the repository locally and open it in your own development environment.

Is there something else about the repository you'd like to know about?`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }
      
      // Build a query that focuses on the selected file if applicable
      let query = input;
      if (selectedFile && !input.toLowerCase().includes(selectedFile.toLowerCase())) {
        // If the user's message doesn't reference the file, make sure the query does
        query = `Regarding the file ${selectedFile}: ${input}`;
      }
      
      // Get response from Gemini
      const response = await queryRepoWithGemini(
        query,
        repoName,
        repoOwner,
        repoDescription || null,
        context,
        fileStructure
      );
      
      // Add custom handling for failed file requests
      if (response.includes("I tried to fetch the content of") && response.includes("but couldn't access it")) {
        // Extract the file path from the error message
        const filePathMatch = response.match(/content of (.+?),/);
        const filePath = filePathMatch ? filePathMatch[1] : "the file";
        
        const enhancedResponse = `I'm sorry, I couldn't access the content of \`${filePath}\`. This might be due to:

1. GitHub API limitations - files with special characters or in certain directories may not be accessible
2. Authentication requirements - some repositories restrict access to certain files
3. The file might not exist or might be in a different location

Is there something else you'd like to know about the repository?`;

        // Add assistant message with enhanced response
        const assistantMessage: Message = {
          role: 'assistant',
          content: enhancedResponse,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Add regular assistant message
        const assistantMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error getting response:", error);
      
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedFile, repoName, repoOwner, repoDescription, repoReadme, fileStructure, toast]);

  // Auto-submit query for selected file when it's first set (placed after handleSubmit)
  useEffect(() => {
    // Only auto-submit if there's a selected file and only one message
    if (selectedFile && messages.length === 1 && !isLoading) {
      const query = `Show me the code in ${selectedFile}`;
      setInput(query);
      
      // Use setTimeout to allow the UI to update with the input before submitting
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
      }, 100);
    }
  }, [selectedFile, messages.length, isLoading, handleSubmit]);

  // Suggestion buttons for common queries
  const suggestions = selectedFile 
    ? [
        `Explain how ${selectedFile} works`,
        `What are the main functions in ${selectedFile}?`,
        `Show me the code in ${selectedFile}`,
        `What does this file do?`
      ]
    : [
        "What files are in this repository?",
        "Explain the project structure",
        "What dependencies does this project use?",
        "Show me the main file"
      ];

  // Add file-specific suggestions if we have files
  if (fileList.length > 0) {
    // Add up to 2 file suggestions
    const fileSuggestions = fileList
      .filter(file => file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json'))
      .slice(0, 2)
      .map(file => `Show me the code in ${file}`);
    
    suggestions.push(...fileSuggestions);
  }

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  // Handle clicking on a file mention in a message
  const handleFileClick = (filename: string) => {
    setInput(`Show me the code in ${filename}`);
  };

  const renderFileButtons = () => {
    if (!fileList.length) return null;
    
    // Get up to 5 important files to show as quick buttons
    const importantFiles = fileList
      .filter(file => {
        const ext = file.split('.').pop()?.toLowerCase();
        return ['js', 'ts', 'jsx', 'tsx', 'json', 'md'].includes(ext || '');
      })
      .slice(0, 5);
    
    if (!importantFiles.length) return null;
    
    return (
      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-2">View key files:</p>
        <div className="flex flex-wrap gap-2">
          {importantFiles.map((file, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs flex items-center"
              onClick={() => handleFileClick(file)}
            >
              <FileText className="h-3 w-3 mr-1" /> {file}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-primary/10 shadow-lg flex flex-col h-[600px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" /> {repoName} Assistant
        </CardTitle>
        <CardDescription>
          Ask questions about this repository and get AI-powered answers
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto mb-2 pb-0">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'assistant' ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div
                className={`rounded-lg px-4 py-2 max-w-[85%] ${
                  message.role === 'assistant'
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <div className="prose dark:prose-invert prose-sm">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <div className={`text-xs mt-1 ${
                  message.role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
          
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          )}
        </div>
      </CardContent>
      
      {messages.length === 1 && !isLoading && (
        <div className="px-6 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestion(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
          
          {renderFileButtons()}
        </div>
      )}
      
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about code, files, or functionality..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()}
            className="bg-primary"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
} 