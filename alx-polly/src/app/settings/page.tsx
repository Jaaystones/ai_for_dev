"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  RotateCcw,
  Bell,
  Shield,
  Palette,
  Clock,
  Users,
  Eye,
  Lock,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface PollSettings {
  defaultExpiry: number; // in minutes
  allowAnonymousVoting: boolean;
  requireAuth: boolean;
  allowMultipleVotes: boolean;
  enableNotifications: boolean;
  defaultVisibility: 'public' | 'private';
  autoGenerateQR: boolean;
  maxOptionsPerPoll: number;
  enableRealTimeResults: boolean;
  allowComments: boolean;
}

interface AccountSettings {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  publicProfile: boolean;
  showStats: boolean;
  theme: 'light' | 'dark' | 'system';
}

const defaultPollSettings: PollSettings = {
  defaultExpiry: 1440, // 24 hours
  allowAnonymousVoting: true,
  requireAuth: false,
  allowMultipleVotes: false,
  enableNotifications: true,
  defaultVisibility: 'public',
  autoGenerateQR: true,
  maxOptionsPerPoll: 10,
  enableRealTimeResults: true,
  allowComments: false
};

const defaultAccountSettings: AccountSettings = {
  emailNotifications: true,
  weeklyDigest: true,
  marketingEmails: false,
  publicProfile: true,
  showStats: true,
  theme: 'system'
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [pollSettings, setPollSettings] = useState<PollSettings>(defaultPollSettings);
  const [accountSettings, setAccountSettings] = useState<AccountSettings>(defaultAccountSettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedPollSettings = localStorage.getItem('pollSettings');
    const savedAccountSettings = localStorage.getItem('accountSettings');
    
    if (savedPollSettings) {
      setPollSettings({ ...defaultPollSettings, ...JSON.parse(savedPollSettings) });
    }
    
    if (savedAccountSettings) {
      setAccountSettings({ ...defaultAccountSettings, ...JSON.parse(savedAccountSettings) });
    }
  }, []);

  const handleSavePollSettings = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // In a real app, this would be an API call
      localStorage.setItem('pollSettings', JSON.stringify(pollSettings));
      
      setMessage({ type: 'success', text: 'Poll settings saved successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to save poll settings. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccountSettings = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // In a real app, this would be an API call
      localStorage.setItem('accountSettings', JSON.stringify(accountSettings));
      
      setMessage({ type: 'success', text: 'Account settings saved successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to save account settings. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPollSettings = () => {
    setPollSettings(defaultPollSettings);
    localStorage.removeItem('pollSettings');
    setMessage({ type: 'success', text: 'Poll settings reset to defaults!' });
  };

  const handleResetAccountSettings = () => {
    setAccountSettings(defaultAccountSettings);
    localStorage.removeItem('accountSettings');
    setMessage({ type: 'success', text: 'Account settings reset to defaults!' });
  };

  const handleDeleteAccount = () => {
    // This would involve calling an API to delete the account
    setMessage({ 
      type: 'error', 
      text: 'Account deletion is not implemented yet. Contact support for assistance.' 
    });
    setShowDeleteWarning(false);
  };

  const getExpiryLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please log in to access settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize your polling experience and account preferences
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="polls" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="polls">Poll Settings</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="polls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Default Poll Configuration
              </CardTitle>
              <CardDescription>
                Set default values for new polls you create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultExpiry">Default Poll Duration</Label>
                  <Select 
                    value={pollSettings.defaultExpiry.toString()} 
                    onValueChange={(value) => setPollSettings(prev => ({ ...prev, defaultExpiry: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="720">12 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                      <SelectItem value="2880">2 days</SelectItem>
                      <SelectItem value="10080">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOptions">Max Options per Poll</Label>
                  <Input
                    id="maxOptions"
                    type="number"
                    min="2"
                    max="20"
                    value={pollSettings.maxOptionsPerPoll}
                    onChange={(e) => setPollSettings(prev => ({ 
                      ...prev, 
                      maxOptionsPerPoll: parseInt(e.target.value) || 2 
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Voting Permissions
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label>Allow Anonymous Voting</Label>
                      <p className="text-sm text-muted-foreground">
                        Let users vote without signing in
                      </p>
                    </div>
                    <Switch
                      checked={pollSettings.allowAnonymousVoting}
                      onCheckedChange={(checked) => setPollSettings(prev => ({ 
                        ...prev, 
                        allowAnonymousVoting: checked,
                        requireAuth: !checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label>Allow Multiple Votes</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can change their vote
                      </p>
                    </div>
                    <Switch
                      checked={pollSettings.allowMultipleVotes}
                      onCheckedChange={(checked) => setPollSettings(prev => ({ 
                        ...prev, 
                        allowMultipleVotes: checked 
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Display & Sharing
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label>Auto-generate QR Codes</Label>
                      <p className="text-sm text-muted-foreground">
                        Create QR codes for easy sharing
                      </p>
                    </div>
                    <Switch
                      checked={pollSettings.autoGenerateQR}
                      onCheckedChange={(checked) => setPollSettings(prev => ({ 
                        ...prev, 
                        autoGenerateQR: checked 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label>Real-time Results</Label>
                      <p className="text-sm text-muted-foreground">
                        Show live vote counts
                      </p>
                    </div>
                    <Switch
                      checked={pollSettings.enableRealTimeResults}
                      onCheckedChange={(checked) => setPollSettings(prev => ({ 
                        ...prev, 
                        enableRealTimeResults: checked 
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSavePollSettings} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Poll Settings'}
                </Button>
                <Button variant="outline" onClick={handleResetPollSettings}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about poll activity
                  </p>
                </div>
                <Switch
                  checked={accountSettings.emailNotifications}
                  onCheckedChange={(checked) => setAccountSettings(prev => ({ 
                    ...prev, 
                    emailNotifications: checked 
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summary of your polls
                  </p>
                </div>
                <Switch
                  checked={accountSettings.weeklyDigest}
                  onCheckedChange={(checked) => setAccountSettings(prev => ({ 
                    ...prev, 
                    weeklyDigest: checked 
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Updates about new features
                  </p>
                </div>
                <Switch
                  checked={accountSettings.marketingEmails}
                  onCheckedChange={(checked) => setAccountSettings(prev => ({ 
                    ...prev, 
                    marketingEmails: checked 
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={accountSettings.theme} 
                  onValueChange={(value: 'light' | 'dark' | 'system') => 
                    setAccountSettings(prev => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSaveAccountSettings} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Account Settings'}
            </Button>
            <Button variant="outline" onClick={handleResetAccountSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control your privacy and data visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your profile
                  </p>
                </div>
                <Switch
                  checked={accountSettings.publicProfile}
                  onCheckedChange={(checked) => setAccountSettings(prev => ({ 
                    ...prev, 
                    publicProfile: checked 
                  }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Show Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Display poll statistics publicly
                  </p>
                </div>
                <Switch
                  checked={accountSettings.showStats}
                  onCheckedChange={(checked) => setAccountSettings(prev => ({ 
                    ...prev, 
                    showStats: checked 
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteWarning ? (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteWarning(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> This action cannot be undone. 
                      This will permanently delete your account and all associated polls.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-3">
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Delete My Account
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteWarning(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
