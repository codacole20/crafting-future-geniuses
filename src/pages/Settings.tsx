
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarUploadDialog } from "@/components/settings/AvatarUploadDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGuestUser } from "@/hooks/useGuestUser";
import { buildPersonalLearningPath } from "@/utils/openai";

const passionOptions = [
  { id: "design", label: "Design" },
  { id: "photography", label: "Photography" },
  { id: "coding", label: "Coding" },
  { id: "music", label: "Music" },
  { id: "writing", label: "Writing" },
  { id: "drawing", label: "Drawing" },
  { id: "painting", label: "Painting" },
  { id: "animation", label: "Animation" },
  { id: "filmmaking", label: "Filmmaking" },
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

const Settings = () => {
  const { toast } = useToast();
  const { user, updateUserPassions } = useGuestUser();
  
  const [localUser, setLocalUser] = useState({
    email: "student@example.com",
    name: "Alex Student",
    avatar: "",
    language: "en",
    passions: [] as string[],
    notifications: {
      lessons: true,
      chat: true,
      streak: true,
    },
    instagramToken: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);

  // Initialize from authenticated user or guest
  useEffect(() => {
    if (user) {
      setLocalUser(prev => ({
        ...prev,
        email: user.isGuest ? 'guest@example.com' : user.email,
        name: user.isGuest ? 'Guest User' : (user.displayName || user.email),
        passions: user.passions || []
      }));
    }
  }, [user]);

  const handlePassionToggle = async (id: string) => {
    let newPassions;
    
    if (localUser.passions.includes(id)) {
      newPassions = localUser.passions.filter(passionId => passionId !== id);
    } else {
      // Limit to 6 passions
      if (localUser.passions.length >= 6) {
        toast({
          title: "Maximum 6 passions allowed",
          description: "Please remove one before adding another."
        });
        return;
      }
      newPassions = [...localUser.passions, id];
    }
    
    setLocalUser({
      ...localUser,
      passions: newPassions,
    });
  };

  const handleAvatarUpdate = (url: string) => {
    setLocalUser({
      ...localUser,
      avatar: url
    });
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Update passions through our context
      await updateUserPassions(localUser.passions);
      
      // Generate a new learning path based on updated passions
      setIsGeneratingPath(true);
      await buildPersonalLearningPath(localUser.passions, user?.isGuest ? null : user?.id);
      
      // Show success message
      setUpdateSuccess(true);
      toast({
        title: "Your new path is ready—let's dive in!",
        description: "Settings updated successfully."
      });
      
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating settings",
        description: "Please try again."
      });
    } finally {
      setIsUpdating(false);
      setIsGeneratingPath(false);
    }
  };

  const handleLogout = async () => {
    if (!user?.isGuest) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("hasCompletedOnboarding");
    window.location.href = "/onboarding";
  };

  return (
    <div className="min-h-screen bg-ct-paper p-5 pb-20">
      <h1 className="text-2xl font-semibold mb-6 font-poppins">Settings</h1>
      
      <div className="bg-ct-white rounded-card shadow-ct mb-6">
        <div className="p-5 border-b">
          <h2 className="font-medium text-lg mb-4">User Profile</h2>
          
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-ct-sky rounded-full flex items-center justify-center mr-4 overflow-hidden">
              {localUser.avatar ? (
                <img 
                  src={localUser.avatar} 
                  alt="User avatar"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User size={24} className="text-gray-600" />
              )}
            </div>
            <div>
              <Button 
                size="sm" 
                className="bg-ct-teal hover:bg-ct-teal/90"
                onClick={() => setShowAvatarDialog(true)}
              >
                Change Avatar
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={localUser.name}
                onChange={e => setLocalUser({...localUser, name: e.target.value})}
                disabled={user?.isGuest}
              />
              {user?.isGuest && (
                <p className="text-xs text-gray-500">Sign in to update your name</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={localUser.email}
                onChange={e => setLocalUser({...localUser, email: e.target.value})}
                disabled={true}
              />
              {user?.isGuest && (
                <p className="text-xs text-gray-500">Sign in to update your email</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-5 border-b">
          <h2 className="font-medium text-lg mb-4">Your Passions</h2>
          <p className="text-sm text-gray-600 mb-4">
            Updating your passions will recalculate your learning path
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {passionOptions.map((passion) => (
              <div
                key={passion.id}
                className={`
                  p-3 rounded-md border flex items-center cursor-pointer
                  ${localUser.passions.includes(passion.id) 
                    ? 'border-ct-teal bg-ct-teal/10' 
                    : 'border-gray-200 hover:bg-gray-50'}
                `}
                onClick={() => handlePassionToggle(passion.id)}
              >
                <Checkbox 
                  checked={localUser.passions.includes(passion.id)}
                  onCheckedChange={() => handlePassionToggle(passion.id)}
                  className="mr-2"
                  id={`passion-${passion.id}`}
                />
                <label 
                  htmlFor={`passion-${passion.id}`}
                  className="flex-1 cursor-pointer"
                >
                  {passion.label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Maximum of 6 passions allowed. {localUser.passions.length}/6 selected.
          </p>
        </div>
        
        <div className="p-5 border-b">
          <h2 className="font-medium text-lg mb-4">App Settings</h2>
          
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={localUser.language}
                onValueChange={value => setLocalUser({...localUser, language: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Notifications</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-lessons" className="cursor-pointer flex-1">
                    Daily lesson reminders
                  </Label>
                  <Switch
                    id="notify-lessons"
                    checked={localUser.notifications.lessons}
                    onCheckedChange={checked => 
                      setLocalUser({
                        ...localUser, 
                        notifications: {...localUser.notifications, lessons: checked}
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-chat" className="cursor-pointer flex-1">
                    Chat notifications
                  </Label>
                  <Switch
                    id="notify-chat"
                    checked={localUser.notifications.chat}
                    onCheckedChange={checked => 
                      setLocalUser({
                        ...localUser, 
                        notifications: {...localUser.notifications, chat: checked}
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-streak" className="cursor-pointer flex-1">
                    Streak reminders
                  </Label>
                  <Switch
                    id="notify-streak"
                    checked={localUser.notifications.streak}
                    onCheckedChange={checked => 
                      setLocalUser({
                        ...localUser, 
                        notifications: {...localUser.notifications, streak: checked}
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5 border-b">
          <h2 className="font-medium text-lg mb-4">Integrations</h2>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="instagram-token">Instagram Token</Label>
              <Input 
                id="instagram-token" 
                value={localUser.instagramToken}
                onChange={e => setLocalUser({...localUser, instagramToken: e.target.value})}
                type="password"
                placeholder="Enter your Instagram API token"
                disabled={user?.isGuest}
              />
              <p className="text-xs text-gray-500">
                Required to track metrics for your projects
                {user?.isGuest && " (Sign in to enable)"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-5 flex justify-between items-center">
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="border-red-300 text-red-500 hover:bg-red-50"
          >
            <LogOut size={16} className="mr-2" />
            {user?.isGuest ? "Go to Onboarding" : "Logout"}
          </Button>
          
          <div className="flex items-center">
            {updateSuccess && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-green-600 mr-3"
              >
                Saved successfully!
              </motion.span>
            )}
            <Button 
              onClick={handleUpdate}
              disabled={isUpdating || isGeneratingPath} 
              className="bg-ct-teal hover:bg-ct-teal/90"
            >
              <Save size={16} className="mr-2" />
              {isUpdating ? "Saving..." : isGeneratingPath ? "Generating Path..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>

      <AvatarUploadDialog
        open={showAvatarDialog}
        onOpenChange={setShowAvatarDialog}
        onSuccess={handleAvatarUpdate}
      />
    </div>
  );
};

export default Settings;
