import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Bell, Wallet, Camera, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';

interface ProfileData {
  id: string;
  created_at: string;
  wallet_address: string;
  full_name: string | null;
  email: string | null;
  updated_at: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const { publicKey, disconnect } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!publicKey) {
        setLoadingProfile(false);
        navigate('/'); 
        return;
      }
      console.log("Settings: Fetching profile for", publicKey.toBase58());
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', publicKey.toBase58())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfileData(data as ProfileData);
          console.log("Profile found:", data);
        } else {
          console.error("Profile not found for connected wallet!");
          toast.error("Error: Profile not found. Try reconnecting.");
          navigate('/auth');
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        toast.error(`Error loading profile: ${err.message}`);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [publicKey, navigate]);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!publicKey) {
      toast.error("Wallet not connected.");
      return;
    }
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const updates: Partial<ProfileData> = {
      full_name: formData.get("fullName") as string,
      email: formData.get("email") as string,
      updated_at: new Date().toISOString(),
    };

    try {
      console.log("Updating profile:", updates);
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('wallet_address', publicKey.toBase58());

      if (error) {
        if (error.code === '23505' && error.message.includes('profiles_email_key')) {
          toast.error("This email is already used by another profile.");
        } else {
          throw error;
        }
      } else {
        toast.success("Profile updated successfully!");
        setProfileData(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(`Error updating: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      toast.success("Wallet disconnected.");
      navigate('/');
    } catch (error: any) {
      console.error("Error disconnecting wallet:", error);
      toast.error(`Error disconnecting: ${error.message}`);
    }
  };

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <Card className="p-6 h-64 bg-card/50 backdrop-blur-sm border-border"></Card>
          <Card className="p-6 h-48 bg-card/50 backdrop-blur-sm border-border"></Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!profileData) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl text-center">
          <p className="text-destructive">Failed to load profile data.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold mb-2">Settings</h2>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData?.avatar_url || ""} alt={profileData?.full_name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">
                      {profileData?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon" variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
                    onClick={() => toast.info("Avatar upload not implemented yet.")}
                  > <Camera className="w-4 h-4" /> </Button>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{profileData?.full_name || "Name not set"}</h3>
                  <p className="text-muted-foreground">{profileData?.email || "Email not set"}</p>
                  <p className="text-sm text-gold mt-1">
                    Member since {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <Separator className="mb-6" />
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    name="walletAddress"
                    type="text"
                    value={profileData?.wallet_address || ""}
                    className="bg-background/30 text-muted-foreground cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName" name="fullName"
                    defaultValue={profileData?.full_name || ""}
                    className="bg-background/50" required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" name="email" type="email"
                    defaultValue={profileData?.email || ""}
                    className="bg-background/50" required
                  />
                </div>
                
                <Button type="submit" variant="hero" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">Set how you want to be notified</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div> 
                    <p className="font-medium">New investors</p> 
                    <p className="text-sm text-muted-foreground"> When someone buys your tokens </p> 
                  </div>
                  <Switch defaultChecked />
                </div> 
                <Separator />
                <div className="flex items-center justify-between">
                  <div> 
                    <p className="font-medium">Voting</p> 
                    <p className="text-sm text-muted-foreground"> New proposals and results </p> 
                  </div>
                  <Switch defaultChecked />
                </div> 
                <Separator />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Connected Wallet</h3>
                  <p className="text-sm text-muted-foreground">Your main address on the platform</p>
                </div>
              </div>
              {publicKey ? (
                <div className="p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Solana Wallet</p>
                        <code className="text-xs text-muted-foreground break-all">
                          {publicKey.toBase58()}
                        </code>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-secondary/20 text-secondary ml-4 flex-shrink-0">
                      Connected
                    </span>
                  </div>
                </div>
              ) : (<p className="text-muted-foreground text-center">No wallet connected.</p>)}
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-destructive/50">
          <h3 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Disconnect Wallet</p>
                <p className="text-sm text-muted-foreground">
                  You’ll need to reconnect to access the dashboard again.
                </p>
              </div>
              <Button variant="outline" onClick={handleDisconnectWallet}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isLoading} >
                <LogOut className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
