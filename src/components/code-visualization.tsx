"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, FolderTree, Code, FileBadge, RefreshCw, FileText, ChevronRight, ChevronDown, Folder } from "lucide-react";
import ReactFlow, { Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'dir';
  children?: FileNode[];
  description?: string;
  size?: number;
  extension?: string;
}

interface CodeVisualizationProps {
  repoName: string;
  repoOwner: string;
  fileStructure: any[];
  onFileClick?: (filePath: string) => void;
}

export function CodeVisualization({ repoName, repoOwner, fileStructure, onFileClick }: CodeVisualizationProps) {
  const [viewType, setViewType] = useState<'tree' | 'graph' | 'list'>('tree');
  const [isLoading, setIsLoading] = useState(false);
  const [hierarchicalData, setHierarchicalData] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fileDescriptions, setFileDescriptions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Process file structure into hierarchical data
  useEffect(() => {
    if (fileStructure && fileStructure.length > 0) {
      // Clear any previous errors
      setError(null);
      
      // Check if fileStructure contains an error message (GitHub API rate limiting)
      if (fileStructure.length === 1 && fileStructure[0]?.message && 
          (fileStructure[0].message.includes('rate limit') || 
           fileStructure[0].message.includes('403'))) {
        setError("GitHub API rate limit exceeded. Please try again later or authenticate with a GitHub token.");
        setIsLoading(false);
        return;
      }
      
      const root: FileNode = {
        path: '',
        name: repoName,
        type: 'dir',
        children: []
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
        const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
        
        currentLevel.children?.push({
          path: file.path || file.name,
          name: fileName,
          type: file.type,
          extension,
          size: file.size,
          description: generateFileDescription(fileName, extension)
        });
      });
      
      setHierarchicalData(root);
      generateFileDescriptions(fileStructure);
    } else if (fileStructure && fileStructure.length === 0) {
      setError("No files found in this repository or access is restricted.");
    }
  }, [fileStructure, repoName]);
  
  // Generate one-line descriptions for files based on extension and name
  const generateFileDescription = (fileName: string, extension?: string): string => {
    if (fileName === 'package.json') {
      return 'Project dependencies and scripts configuration';
    } else if (fileName === 'tsconfig.json') {
      return 'TypeScript configuration for the project';
    } else if (fileName === 'tailwind.config.js') {
      return 'Tailwind CSS configuration';
    } else if (fileName === 'next.config.js') {
      return 'Next.js framework configuration';
    } else if (fileName.includes('layout') && (extension === 'tsx' || extension === 'jsx')) {
      return 'Page layout component defining the UI structure';
    } else if (fileName.includes('page') && (extension === 'tsx' || extension === 'jsx')) {
      return 'Page component rendered at route';
    } else if (fileName === 'README.md') {
      return 'Project documentation and setup instructions';
    } else if (fileName === '.gitignore') {
      return 'Specifies files Git should ignore';
    } else if (fileName.startsWith('.env')) {
      return 'Environment variables configuration';
    }
    
    switch(extension) {
      case 'js':
      case 'jsx':
        return 'JavaScript source file';
      case 'ts':
      case 'tsx':
        return 'TypeScript source file';
      case 'css':
        return 'CSS styles';
      case 'scss':
        return 'SASS stylesheet';
      case 'json':
        return 'JSON configuration file';
      case 'md':
        return 'Markdown documentation';
      case 'svg':
        return 'SVG graphic asset';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'Image asset';
      default:
        return 'Project file';
    }
  };
  
  // Generate file descriptions for all files
  const generateFileDescriptions = (files: any[]) => {
    const descriptions: Record<string, string> = {};
    
    files.forEach(file => {
      if (file.type === 'file') {
        const fileName = file.name;
        const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
        descriptions[file.path || file.name] = generateFileDescription(fileName, extension);
      }
    });
    
    setFileDescriptions(descriptions);
  };
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  // Search through files and folders
  const filterItems = (node: FileNode, term: string): boolean => {
    if (!term) return true;
    
    const matchesName = node.name.toLowerCase().includes(term.toLowerCase());
    
    if (matchesName) return true;
    
    if (node.children) {
      // Expand folder if a child matches
      for (const child of node.children) {
        if (filterItems(child, term)) {
          if (node.type === 'dir') {
            setExpandedFolders(prev => new Set([...prev, node.path]));
          }
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Render tree file structure
  const renderTree = (node: FileNode, level: number = 0) => {
    if (!node) return null;
    
    // Skip if this doesn't match search
    if (searchTerm && !filterItems(node, searchTerm)) {
      return null;
    }
    
    const isExpanded = expandedFolders.has(node.path);
    const paddingLeft = `${level * 16}px`;
    
    if (node.type === 'dir') {
      return (
        <div key={node.path}>
          <div 
            className={`flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer`}
            style={{ paddingLeft }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
            }
            <Folder className="h-4 w-4 mr-2 text-blue-500" />
            <span className="font-medium">{node.name}</span>
          </div>
          
          {isExpanded && node.children && (
            <div>
              {node.children.sort((a, b) => {
                // Directories first, then files
                if (a.type !== b.type) {
                  return a.type === 'dir' ? -1 : 1;
                }
                // Alphabetical order
                return a.name.localeCompare(b.name);
              }).map(child => renderTree(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      // File node
      const fileExtension = node.extension || '';
      
      return (
        <div 
          key={node.path}
          className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer group"
          style={{ paddingLeft }}
          onClick={() => onFileClick && onFileClick(node.path)}
        >
          <FileText className="h-4 w-4 mr-2 text-gray-500" />
          <span>{node.name}</span>
          
          {/* File description on hover */}
          <div className="ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 truncate">
            {fileDescriptions[node.path] || generateFileDescription(node.name, fileExtension)}
          </div>
        </div>
      );
    }
  };
  
  // Render list view
  const renderList = () => {
    const filteredFiles = fileStructure.filter((file: any) => {
      return !searchTerm || file.path?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             file.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    return (
      <div className="space-y-1 mt-4">
        {filteredFiles.sort((a: any, b: any) => {
          // Directories first, then files
          if (a.type !== b.type) {
            return a.type === 'dir' ? -1 : 1;
          }
          // Alphabetical sort
          return (a.path || a.name).localeCompare(b.path || b.name);
        }).map((file: any) => {
          const path = file.path || file.name;
          const fileName = path.split('/').pop();
          const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
          
          return (
            <div 
              key={path}
              className="flex items-center justify-between py-2 px-3 hover:bg-accent rounded cursor-pointer"
              onClick={() => onFileClick && file.type === 'file' && onFileClick(path)}
            >
              <div className="flex items-center">
                {file.type === 'dir' ? (
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                )}
                <span className="text-sm">{path}</span>
              </div>
              
              {file.type === 'file' && (
                <div className="text-xs text-muted-foreground max-w-[50%] truncate">
                  {fileDescriptions[path] || generateFileDescription(fileName, fileExtension)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Generate graph nodes and edges for the graph view
  const generateGraphData = () => {
    if (!hierarchicalData) return { nodes: [], edges: [] };
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const processNode = (node: FileNode, parentId: string | null = null, x = 0, y = 0) => {
      const nodeId = node.path || node.name;
      const nodeType = node.type === 'dir' ? 'folder' : 'file';
      
      // Add this node
      nodes.push({
        id: nodeId,
        type: nodeType,
        data: { 
          label: node.name,
          path: node.path,
          type: node.type,
          description: node.type === 'file' ? (fileDescriptions[node.path] || '') : ''
        },
        position: { x, y }
      });
      
      // Connect to parent
      if (parentId) {
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId
        });
      }
      
      // Process children
      if (node.children) {
        let childX = x;
        let childY = y + 100;
        
        node.children.forEach((child, index) => {
          childX = x - 150 + (index * 150);
          processNode(child, nodeId, childX, childY);
        });
      }
    };
    
    processNode(hierarchicalData);
    
    return { nodes, edges };
  };
  
  // Filter nodes based on search term
  const filteredHierarchicalData = hierarchicalData ? {
    ...hierarchicalData,
    children: hierarchicalData.children?.filter(node => filterItems(node, searchTerm))
  } : null;
  
  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" /> Codebase Visualization
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsLoading(true)}
            className="flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
        </div>
        <CardDescription>
          Explore the structure and organization of this repository
        </CardDescription>
        
        {/* Search input */}
        <div className="flex mt-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files and folders..."
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Show error message if present */}
        {error && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20 mb-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">GitHub API Error</h3>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <div className="mt-4 bg-muted p-4 rounded-md text-sm">
              <p className="font-medium mb-2">Common causes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>GitHub API rate limit (60 requests/hour for unauthenticated users)</li>
                <li>Repository requires authentication</li>
                <li>Repository doesn't exist or is private</li>
              </ul>
              <p className="mt-2">Try again in an hour or use a GitHub token.</p>
            </div>
          </div>
        )}
        
        {!error && (
          <Tabs defaultValue="tree" onValueChange={(v) => setViewType(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="tree">
                <FolderTree className="h-4 w-4 mr-2" /> Tree View
              </TabsTrigger>
              <TabsTrigger value="list">
                <FileBadge className="h-4 w-4 mr-2" /> List View
              </TabsTrigger>
              <TabsTrigger value="graph" disabled>
                <Code className="h-4 w-4 mr-2" /> Graph View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tree" className="min-h-[400px] max-h-[550px] overflow-auto">
              {filteredHierarchicalData && renderTree(filteredHierarchicalData)}
              {!filteredHierarchicalData && !error && (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list" className="min-h-[400px] max-h-[550px] overflow-auto">
              {renderList()}
            </TabsContent>
            
            <TabsContent value="graph" className="min-h-[400px]">
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Graph view is under development
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
} 