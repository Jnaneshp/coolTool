"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import { Github, BarChart3, Code, Star, GitFork, Eye, Loader2, BookOpen } from "lucide-react";
import Image from "next/image";
import { RepoDocumentation } from "@/components/repo-documentation";

interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string;
  owner: {
    avatar_url: string;
    login: string;
  };
}

export default function HomePage() {
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  const [githubUsername, setGithubUsername] = useState("");
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRepos, setShowRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);

  // Map languages to colors
  const languageColors: Record<string, string> = {
    JavaScript: "bg-yellow-400",
    TypeScript: "bg-blue-500",
    Python: "bg-green-500",
    Java: "bg-red-500",
    "C#": "bg-purple-500",
    Ruby: "bg-pink-500",
    Go: "bg-cyan-500",
    PHP: "bg-indigo-500",
    Rust: "bg-orange-500",
    Dart: "bg-teal-500",
    HTML: "bg-orange-600",
    CSS: "bg-blue-400",
  };

  useEffect(() => {
    // Attempt to extract GitHub username from user object if it exists
    if (isLoaded && user) {
      const githubAccount = user.externalAccounts.find(
        (account) => account.provider === "github"
      );
      
      if (githubAccount) {
        setGithubUsername(githubAccount.username || "");
      }
    }
  }, [isLoaded, user]);

  const fetchRepositories = async () => {
    if (!githubUsername) {
      toast({
        title: "No GitHub Username",
        description: "Please link your GitHub account or enter a username.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated`);
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await response.json();
      setRepositories(data);
      setShowRepos(true);
    } catch (error) {
      toast({
        title: "Error Fetching Repositories",
        description: "Could not fetch GitHub repositories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewRepositoryDocs = (repo: GithubRepo) => {
    setSelectedRepo(repo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = [
    {
      title: "Total Projects",
      value: repositories.length.toString(),
      icon: <Code className="h-6 w-6 text-indigo-500" />,
    },
    {
      title: "Stars",
      value: repositories.reduce((acc, repo) => acc + repo.stargazers_count, 0).toString(),
      icon: <Star className="h-6 w-6 text-yellow-500" />,
    },
    {
      title: "Forks",
      value: repositories.reduce((acc, repo) => acc + repo.forks_count, 0).toString(),
      icon: <GitFork className="h-6 w-6 text-blue-500" />,
    },
    {
      title: "Watchers",
      value: repositories.reduce((acc, repo) => acc + repo.watchers_count, 0).toString(),
      icon: <Eye className="h-6 w-6 text-green-500" />,
    },
  ];

  // Top languages based on repositories
  const topLanguages = repositories.reduce((langs: Record<string, number>, repo) => {
    if (repo.language) {
      langs[repo.language] = (langs[repo.language] || 0) + 1;
    }
    return langs;
  }, {});

  const sortedLanguages = Object.entries(topLanguages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // If a repository is selected, show its documentation
  if (selectedRepo) {
    return (
      <div className="space-y-8">
        <RepoDocumentation 
          repoName={selectedRepo.name} 
          repoOwner={selectedRepo.owner.login}
          repoDescription={selectedRepo.description} 
          onBack={() => setSelectedRepo(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome{user && `, ${user.firstName || ''}`}</h1>
        <p className="text-muted-foreground">
          View your GitHub profile, repositories, and smart AI-powered documentation.
        </p>
      </div>

      {/* GitHub Integration Card */}
      <Card className="border-2 border-primary/10 shadow-lg hover:shadow-xl transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-6 w-6" /> GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect with GitHub to view your repositories, stats and AI documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-3">
              {user?.imageUrl && (
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  <Image 
                    src={user.imageUrl} 
                    alt="Profile" 
                    fill 
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium">{user?.fullName || 'Welcome'}</p>
                <p className="text-sm text-muted-foreground">
                  {githubUsername ? (
                    <span className="flex items-center">
                      <Github className="h-3 w-3 mr-1" /> {githubUsername}
                    </span>
                  ) : (
                    "No GitHub account linked"
                  )}
                </p>
              </div>
            </div>
            <div className="flex-1 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="GitHub Username" 
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button 
              onClick={fetchRepositories}
              disabled={loading || !githubUsername}
              className="w-full md:w-auto rounded-l-none md:rounded-l-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Fetch Repositories
                </>
              )}
            </Button>
          </div>

          {/* Stats Grid - Only show if repositories are loaded */}
          {showRepos && repositories.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div>{stat.icon}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Top Languages - Only show if repositories are loaded */}
          {showRepos && sortedLanguages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3">Top Languages</h3>
              <div className="flex flex-wrap gap-2">
                {sortedLanguages.map(([language, count]) => (
                  <div 
                    key={language} 
                    className={`px-3 py-1 rounded-full text-white text-sm ${languageColors[language] || 'bg-gray-500'}`}
                  >
                    {language} ({count})
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repository Grid */}
      {showRepos && repositories.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Repositories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repositories.map((repo) => (
              <Card key={repo.id} className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">
                    <a 
                      href={repo.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors flex items-center"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      {repo.name}
                    </a>
                  </CardTitle>
                  {repo.description && (
                    <CardDescription className="line-clamp-2 h-10">
                      {repo.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-3">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                        {repo.stargazers_count}
                      </span>
                      <span className="flex items-center">
                        <GitFork className="h-4 w-4 mr-1 text-blue-500" />
                        {repo.forks_count}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1 text-green-500" />
                        {repo.watchers_count}
                      </span>
                    </div>
                    {repo.language && (
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${languageColors[repo.language] || 'bg-gray-500'}`}>
                        {repo.language}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-sm"
                      asChild
                    >
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-1" /> View
                      </a>
                    </Button>
                    <Button 
                      variant="default" 
                      className="flex-1 text-sm"
                      onClick={() => viewRepositoryDocs(repo)}
                    >
                      <BookOpen className="h-4 w-4 mr-1" /> Docs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Show a message if no repositories are found */}
      {showRepos && repositories.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Github className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Repositories Found</h3>
            <p className="text-muted-foreground mt-2">
              The provided GitHub username doesn't have any public repositories or doesn't exist.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
} 