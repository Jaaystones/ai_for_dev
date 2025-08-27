"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Edit3,
  Save,
  X,
  Mail,
  Calendar,
  BarChart3,
  Vote,
  Eye,
  Share2,
  Upload,
  Camera
} from 'lucide-react';
import { usePollsRealtime } from '@/hooks/usePollRealtime';

interface ProfileStats {
  totalPolls: number;
  totalVotes: number;
  totalViews: number;
  pollsThisMonth: number;
  mostPopularPoll?: {
    title: string;
    votes: number;
  };
}

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    avatar_url: ''
  });

  // Preview state for uploaded image
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<ProfileStats>({
    totalPolls: 0,
    totalVotes: 0,
    totalViews: 0,
    pollsThisMonth: 0
  });

  // Get user's polls
  const { polls: userPolls, loading: pollsLoading } = usePollsRealtime({
    userId: user?.id
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  // Calculate stats from user polls
  useEffect(() => {
    if (userPolls) {
      const totalVotes = userPolls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0);
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      const pollsThisMonth = userPolls.filter(poll =>
        new Date(poll.created_at) > thisMonth
      ).length;

      const mostPopular = userPolls.length > 0
        ? userPolls.reduce((max, poll) =>
          (poll.total_votes || 0) > (max.total_votes || 0) ? poll : max
        )
        : null;

      setStats({
        totalPolls: userPolls.length,
        totalVotes,
        totalViews: userPolls.reduce((sum, poll) => sum + (poll.total_votes || 0) * 1.5, 0), // Estimate
        pollsThisMonth,
        mostPopularPoll: mostPopular ? {
          title: mostPopular.title,
          votes: mostPopular.total_votes || 0
        } : undefined
      });
    }
  }, [userPolls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Only update text fields since avatar is handled separately
      await updateProfile({
        full_name: formData.full_name,
        username: formData.username,
        avatar_url: formData.avatar_url // This will be updated by image upload
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setImagePreview(null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.size, file.type);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    try {
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading to /api/upload/avatar...');

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);

      const result = await response.json();
      console.log('Upload result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update form data with the server URL
      setFormData(prev => ({ ...prev, avatar_url: result.url }));
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });

      // Update the auth context manually to avoid page reload
      if (updateProfile) {
        await updateProfile({
          full_name: profile?.full_name || '',
          username: profile?.username || '',
          avatar_url: result.url
        });
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploadingImage(true);
      setMessage(null);
      
      // Call API to remove avatar
      const response = await fetch('/api/upload/avatar/remove', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove avatar');
      }

      // Update local state
      setImagePreview(null);
      setFormData(prev => ({ ...prev, avatar_url: '' }));
      
      // Reset file input
      const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Update auth context
      if (updateProfile) {
        await updateProfile({
          full_name: profile?.full_name || '',
          username: profile?.username || '',
          avatar_url: ''
        });
      }

      setMessage({ type: 'success', text: 'Avatar removed successfully!' });
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove avatar. Please try again.'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        avatar_url: profile.avatar_url || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please log in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and view your polling statistics
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg">
                  {profile?.full_name ? getInitials(profile.full_name) :
                    profile?.username ? getInitials(profile.username) :
                      user.email ? getInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {profile?.full_name || profile?.username || 'User'}
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    Joined {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Unknown date'
                    }
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="Choose a username"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Profile Avatar</Label>
                  <div className="flex items-start gap-4">
                    {/* Current/Preview Avatar */}
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-muted">
                        <AvatarImage
                          src={imagePreview || profile?.avatar_url || undefined}
                          alt="Profile avatar"
                        />
                        <AvatarFallback className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          {profile?.full_name ? getInitials(profile.full_name) :
                            profile?.username ? getInitials(profile.username) :
                              user?.email ? getInitials(user.email) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {(imagePreview || profile?.avatar_url) && isEditing && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Upload Section */}
                    {isEditing && (
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col gap-2">
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            disabled={uploadingImage}
                            className="w-fit"
                          >
                            {uploadingImage ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Choose Image
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            Upload a new profile picture (max 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Polls</p>
                    <p className="text-2xl font-bold">{stats.totalPolls}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <Vote className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="text-2xl font-bold">{stats.totalVotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">{Math.round(stats.totalViews)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                    <Share2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">{stats.pollsThisMonth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.mostPopularPoll && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Popular Poll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{stats.mostPopularPoll.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.mostPopularPoll.votes} votes
                    </p>
                  </div>
                  <Progress
                    value={Math.min((stats.mostPopularPoll.votes / Math.max(stats.totalVotes, 1)) * 100, 100)}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {pollsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mt-1"></div>
                    </div>
                  ))}
                </div>
              ) : userPolls && userPolls.length > 0 ? (
                <div className="space-y-3">
                  {userPolls.slice(0, 5).map((poll) => (
                    <div key={poll.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{poll.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(poll.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={poll.is_active ? "default" : "secondary"}>
                        {poll.total_votes || 0} votes
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No polls created yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
