"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart, PieChart, ArrowRight, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your analytics report is being prepared for download.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your performance and gather insights from your data.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={selectedTab === "overview" ? "default" : "ghost"}
          className="rounded-b-none"
          onClick={() => setSelectedTab("overview")}
        >
          Overview
        </Button>
        <Button
          variant={selectedTab === "users" ? "default" : "ghost"}
          className="rounded-b-none"
          onClick={() => setSelectedTab("users")}
        >
          User Analytics
        </Button>
        <Button
          variant={selectedTab === "revenue" ? "default" : "ghost"}
          className="rounded-b-none"
          onClick={() => setSelectedTab("revenue")}
        >
          Revenue
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-indigo-500" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Monthly performance data and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full rounded-md bg-muted flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  Bar chart visualization would render here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="mr-2 h-5 w-5 text-green-500" />
              Growth Trends
            </CardTitle>
            <CardDescription>
              User growth and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full rounded-md bg-muted flex items-center justify-center">
              <div className="text-center">
                <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  Line chart visualization would render here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-blue-500" />
              Revenue Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of revenue sources and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full rounded-md bg-muted flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  Pie chart visualization would render here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">User Segmentation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze your user base by demographics and behavior
            </p>
            <Button variant="ghost" className="w-full justify-between">
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">Conversion Rates</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track user journeys and conversion funnels
            </p>
            <Button variant="ghost" className="w-full justify-between">
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">Forecasting</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Predictive analytics and future trends
            </p>
            <Button variant="ghost" className="w-full justify-between">
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 