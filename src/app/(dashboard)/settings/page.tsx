"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile } from "@clerk/nextjs";
import { Bell, Lock, Eye, User2, Globe, Palette, Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs/Navigation */}
        <div className="md:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center w-full px-2 py-2 rounded-md text-sm ${
                    activeTab === "profile"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <User2 className="mr-2 h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`flex items-center w-full px-2 py-2 rounded-md text-sm ${
                    activeTab === "appearance"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Appearance
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`flex items-center w-full px-2 py-2 rounded-md text-sm ${
                    activeTab === "notifications"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className={`flex items-center w-full px-2 py-2 rounded-md text-sm ${
                    activeTab === "privacy"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Privacy
                </button>
                <button
                  onClick={() => setActiveTab("accessibility")}
                  className={`flex items-center w-full px-2 py-2 rounded-md text-sm ${
                    activeTab === "accessibility"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Accessibility
                </button>
                <button
                  onClick={() => setActiveTab("language")}
                  className={`flex items-center w-full px-2 py-2 rounded-md text-sm ${
                    activeTab === "language"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Language
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your profile information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfile />
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Theme Options</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose your preferred theme for the dashboard
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border p-4 rounded-md flex flex-col items-center space-y-2 cursor-pointer hover:border-primary">
                        <div className="h-20 w-full rounded bg-background"></div>
                        <span className="text-sm">Light</span>
                      </div>
                      <div className="border p-4 rounded-md flex flex-col items-center space-y-2 cursor-pointer hover:border-primary">
                        <div className="h-20 w-full rounded bg-slate-900"></div>
                        <span className="text-sm">Dark</span>
                      </div>
                      <div className="border p-4 rounded-md flex flex-col items-center space-y-2 cursor-pointer hover:border-primary">
                        <div className="h-20 w-full rounded bg-gradient-to-b from-background to-slate-900"></div>
                        <span className="text-sm">System</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-medium">Layout Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adjust your dashboard layout preferences
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4 cursor-pointer hover:border-primary">
                        <div className="h-24 w-full flex">
                          <div className="h-full w-1/4 bg-muted rounded-l"></div>
                          <div className="h-full w-3/4 bg-background rounded-r border-l"></div>
                        </div>
                        <p className="text-sm mt-2 text-center">Sidebar Layout</p>
                      </Card>
                      <Card className="p-4 cursor-pointer hover:border-primary">
                        <div className="h-24 w-full flex flex-col">
                          <div className="h-1/4 w-full bg-muted rounded-t"></div>
                          <div className="h-3/4 w-full bg-background rounded-b border-t"></div>
                        </div>
                        <p className="text-sm mt-2 text-center">Topbar Layout</p>
                      </Card>
                    </div>
                  </div>
                </div>
                
                <Button className="mt-6" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>Saving Changes...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {(activeTab === "notifications" || 
            activeTab === "privacy" || 
            activeTab === "accessibility" || 
            activeTab === "language") && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings
                </CardTitle>
                <CardDescription>
                  This feature is coming soon. 
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="mb-4 mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    {activeTab === "notifications" && <Bell className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === "privacy" && <Lock className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === "accessibility" && <Eye className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === "language" && <Globe className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We're currently working on implementing this feature.
                    Check back later for updates!
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => {
                      toast({
                        title: "Feature In Development",
                        description: "We'll notify you when this feature becomes available.",
                      });
                    }}
                  >
                    Get Notified When Available
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 