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
import Avatar from "@/components/Avatar";

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

interface UserWithPassions {
  id: string;
  email: string;
  name: string;
  avatar: string;
  language: string;
  passions: string[];
  notifications: {
    lessons: boolean;
    chat: boolean;
    streak: boolean;
  };
  instagramToken: string;
}

interface DbUser {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string;
  lang: string;
  roles: "student" | "teacher" | "parent" | "admin";
  created_at: string;
  passions?: string[];
}

const Settings = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<UserWithPassions>({
    id: "",
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
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          console.log("No authenticated user found");
          return;
        }

        const { data: userData, error } = await supabase
          .from('Crafting Tomorrow Users')
          .select('*')
          .eq('email', authData.user.email)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }

        const userPassions = (userData.passions || []) as string[];

        setUser({
          id: userData.id.toString(),
          email: userData.email,
          name: userData.display_name || authData.user.email.split('@')[0],
          avatar: userData.avatar_url || "",
          language: userData.lang || "en",
          passions: userPassions,
          notifications: {
            lessons: true,
            chat: true,
            streak: true,
          },
          instagramToken: "",
        });
      } catch (err) {
        console.error("Error in loadUserData:", err);
      }
    };

    loadUserData();
  }, []);

  const handlePassionToggle = (id: string) => {
    if (user.passions.includes(id)) {
      setUser({
        ...user,
        passions: user.passions.filter(passionId => passionId !== id),
      });
    } else {
      setUser({
        ...user,
        passions: [...user.passions, id],
      });
    }
  };

  const handleAvatarUpdate = (url: string) => {
    setUser({
      ...user,
      avatar: url
    });
  };

  const generateLessonPlan = async (passions: string[]) => {
    if (!user.id) return;
    const passionsToUse = passions.length > 0 ? passions : ["general"];
    
    setIsGeneratingPlan(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        throw new Error("No authenticated user");
      }
      
      const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
        body: {
          passions: passionsToUse.map(id => passionOptions.find(p => p.id === id)?.label || id),
          userId: user.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Quest path updated!",
        description: "Your personalized learning journey has been created."
      });
      
      localStorage.removeItem("userXp");
      localStorage.removeItem("userStreak");
      localStorage.removeItem("lastLoginDate");
      
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      toast({
        title: "Couldn't refresh lessons right now",
        description: "Using existing path.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        throw new Error("No authenticated user");
      }
      
      let userId: number;
      
      try {
        userId = parseInt(user.id);
        if (isNaN(userId)) {
          console.log("Using auth user ID instead of parsed ID");
          userId = undefined as unknown as number;
        }
      } catch (e) {
        console.error("Error parsing user ID:", e);
        userId = undefined as unknown as number;
      }
      
      const upsertData: Partial<DbUser> = {
        display_name: user.name,
        lang: user.language,
        passions: user.passions,
        email: user.email,
        roles: "student" // Default role
      };
      
      if (!isNaN(userId)) {
        upsertData.id = userId;
      }
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('Crafting Tomorrow Users')
        .upsert(upsertData)
        .select('*')
        .single();
        
      if (updateError) throw updateError;
      
      if (updatedUser) {
        const updatedPassions = (updatedUser.passions || []) as string[];
        
        setUser({
          ...user,
          passions: updatedPassions
        });
      }
      
      await generateLessonPlan(user.passions);
      
      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully."
      });
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Could not save your settings.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("hasCompletedOnboarding");
      window.location.href = "/onboarding";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-ct-paper p-5 pb-20">
      <h1 className="text-2xl font-semibold mb-6 font-poppins">Settings</h1>
      
      <div className="bg-ct-white rounded-card shadow-ct mb-6">
        <div className="p-5 border-b">
          <h2 className="font-medium text-lg mb-4">User Profile</h2>
          
          <div className="flex items-center mb-6">
            <Avatar src={user.avatar} alt="User avatar" size="lg" className="mr-4" />
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
                value={user.name}
                onChange={e => setUser({...user, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={user.email}
                onChange={e => setUser({...user, email: e.target.value})}
                disabled
              />
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
                  ${user.passions.includes(passion.id) 
                    ? 'border-ct-teal bg-ct-teal/10' 
                    : 'border-gray-200 hover:bg-gray-50'}
                `}
                onClick={() => handlePassionToggle(passion.id)}
              >
                <Checkbox 
                  checked={user.passions.includes(passion.id)}
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
        </div>
        
        <div className="p-5 border-b">
          <h2 className="font-medium text-lg mb-4">App Settings</h2>
          
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={user.language}
                onValueChange={value => setUser({...user, language: value})}
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
                    checked={user.notifications.lessons}
                    onCheckedChange={checked => 
                      setUser({
                        ...user, 
                        notifications: {...user.notifications, lessons: checked}
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
                    checked={user.notifications.chat}
                    onCheckedChange={checked => 
                      setUser({
                        ...user, 
                        notifications: {...user.notifications, chat: checked}
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
                    checked={user.notifications.streak}
                    onCheckedChange={checked => 
                      setUser({
                        ...user, 
                        notifications: {...user.notifications, streak: checked}
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
                value={user.instagramToken}
                onChange={e => setUser({...user, instagramToken: e.target.value})}
                type="password"
                placeholder="Enter your Instagram API token"
              />
              <p className="text-xs text-gray-500">
                Required to track metrics for your projects
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
            Logout
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
              disabled={isUpdating || isGeneratingPlan} 
              className="bg-ct-teal hover:bg-ct-teal/90"
            >
              <Save size={16} className="mr-2" />
              {isUpdating || isGeneratingPlan ? 
                (isGeneratingPlan ? "Generating Quest..." : "Saving...") : 
                "Save Settings"}
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
