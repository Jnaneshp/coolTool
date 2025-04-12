"use client";

import { useState } from "react";
import { UserProfile } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BarChart3, Users, Globe, Activity, Settings, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardPage() {
  const { toast } = useToast();
  const [showUserProfile, setShowUserProfile] = useState(false);

  const stats = [
    {
      title: "Total Users",
      value: "10,452",
      change: "+12.3%",
      icon: <Users className="h-6 w-6 text-indigo-500" />,
    },
    {
      title: "Active Sessions",
      value: "2,125",
      change: "+5.4%",
      icon: <Activity className="h-6 w-6 text-green-500" />,
    },
    {
      title: "Global Reach",
      value: "86",
      change: "+2.5%",
      icon: <Globe className="h-6 w-6 text-blue-500" />,
    },
    {
      title: "Total Revenue",
      value: "$25,243",
      change: "+18.7%",
      icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
    },
  ];

  const features = [
    {
      title: "Analytics Dashboard",
      description: "Track your performance metrics in real-time",
      icon: <BarChart3 className="h-8 w-8 text-indigo-500" />,
    },
    {
      title: "User Management",
      description: "Easily manage users and permissions",
      icon: <Users className="h-8 w-8 text-green-500" />,
    },
    {
      title: "Global Data",
      description: "Access data from around the world instantly",
      icon: <Globe className="h-8 w-8 text-blue-500" />,
    },
    {
      title: "Advanced Settings",
      description: "Customize your experience with detailed settings",
      icon: <Settings className="h-8 w-8 text-purple-500" />,
    },
  ];

  const handleButtonClick = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "This feature is currently under development.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your project today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div>{stat.icon}</div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium">{stat.change}</span>
              <ArrowUpRight className="ml-1 h-4 w-4 text-green-500" />
              <span className="ml-2 text-muted-foreground">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">Key Features</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 shadow-md hover:shadow-lg transition-all hover:translate-y-[-5px]">
              <div className="mb-4 p-2 inline-block bg-background rounded-lg">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
              <Button 
                className="mt-4 w-full"
                onClick={handleButtonClick}
              >
                Explore
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-10">
        <Button 
          variant="outline"
          onClick={() => setShowUserProfile(!showUserProfile)}
          className="flex items-center gap-2"
        >
          <Info className="h-4 w-4" />
          {showUserProfile ? "Hide" : "View"} Your Profile
        </Button>
      </div>

      {showUserProfile && (
        <div className="mt-4 p-6 border rounded-lg">
          <h2 className="text-xl font-bold mb-4">Your Profile</h2>
          <UserProfile />
        </div>
      )}
    </div>
  );
} 