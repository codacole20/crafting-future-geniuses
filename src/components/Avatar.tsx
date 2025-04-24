
import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar = ({ src, alt = "User avatar", size = 'md', className = '' }: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className={`rounded-full overflow-hidden bg-ct-sky flex items-center justify-center ${sizeClass} ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
      ) : (
        <User size={size === 'sm' ? 16 : size === 'lg' ? 32 : 24} className="text-gray-600" />
      )}
    </div>
  );
};

export default Avatar;
