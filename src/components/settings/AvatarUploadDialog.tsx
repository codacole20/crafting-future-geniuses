
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (url: string) => void;
}

export function AvatarUploadDialog({ open, onOpenChange, onSuccess }: AvatarUploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      
      if (!file) return;
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      // Get file extension
      const ext = file.name.split('.').pop();
      
      // Create a valid filename that doesn't confuse Supabase
      const randomId = Math.random().toString(36).substring(2, 10);
      const fileName = `${randomId}-${Date.now()}.${ext}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update user's avatar URL in profiles
      // Convert string ID to number if needed for Crafting Tomorrow Users table
      const numericId = user.id ? parseInt(user.id, 10) : null;
      
      if (!numericId) throw new Error("Invalid user ID");

      const { error: updateError } = await supabase
        .from('Crafting Tomorrow Users')
        .update({ avatar_url: publicUrl })
        .eq('id', numericId);

      if (updateError) throw updateError;

      onSuccess(publicUrl);
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Camera size={48} className="text-muted-foreground" />
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Maximum file size: 2MB
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
