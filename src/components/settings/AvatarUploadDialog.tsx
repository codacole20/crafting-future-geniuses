
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image, X, Camera, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (url: string) => void;
}

export function AvatarUploadDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: AvatarUploadDialogProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };
  
  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewURL(null);
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      // Get the current authenticated user
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        throw new Error("You must be signed in to upload an avatar");
      }
      
      // First get the user's numeric ID from the database
      const { data: userData, error: userError } = await supabase
        .from('Crafting Tomorrow Users')
        .select('id')
        .eq('email', authData.user.email)
        .single();
        
      if (userError || !userData) {
        throw new Error("Could not retrieve user information");
      }
      
      // Generate a unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = new Date().getTime();
      const filePath = `${userData.id}_${timestamp}.${fileExt}`;
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, {
          upsert: true
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (!publicURL) {
        throw new Error("Failed to get public URL for uploaded image");
      }
      
      // Update the user's avatar_url in the database
      const { error: updateError } = await supabase
        .from('Crafting Tomorrow Users')
        .update({ avatar_url: publicURL.publicUrl })
        .eq('id', userData.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      onSuccess(publicURL.publicUrl);
      
      // Close dialog
      onOpenChange(false);
      
      // Show success message
      toast({
        title: "Profile photo updated!",
        description: "Your new avatar has been saved",
      });
      
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again or use a smaller image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Profile Photo</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {previewURL ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100">
              <img 
                src={previewURL} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={resetUpload}
                className="absolute top-0 right-0 bg-gray-800/70 p-1 rounded-full text-white hover:bg-gray-700/70"
                aria-label="Remove selected image"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
              <Camera size={48} className="text-gray-400" />
            </div>
          )}
          
          <div className="flex flex-col space-y-2 w-full">
            {!previewURL && (
              <>
                <label htmlFor="avatar-upload" className="w-full">
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <UploadCloud size={24} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to select an image</p>
                    <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
                  </div>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
              </>
            )}
            
            {previewURL && (
              <Button 
                onClick={uploadAvatar} 
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 rounded-full mr-2" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Image className="mr-2" size={16} />
                    Save Profile Photo
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
