import { SignUp } from "@clerk/nextjs";
import { Github } from "lucide-react";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="p-4 sm:p-6 md:p-8 rounded-xl border-border shadow-md bg-card">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Join BombasticTool</h1>
          <p className="text-muted-foreground">
            Create an account to access your dashboard and GitHub repositories
          </p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <Github className="h-6 w-6 text-foreground" />
            <span className="text-sm font-medium">Connect with GitHub for full features</span>
          </div>
        </div>
        <SignUp />
      </div>
    </div>
  );
} 