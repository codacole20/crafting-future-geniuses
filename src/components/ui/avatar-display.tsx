
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface AvatarDisplayProps {
  url?: string | null;
  className?: string;
}

export function AvatarDisplay({ url, className }: AvatarDisplayProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={url || undefined} alt="User avatar" />
      <AvatarFallback>
        <User className="h-6 w-6 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  );
}
