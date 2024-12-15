import React from 'react';

const UserAvatar = ({ user, size = "default" }) => {
  // Get first letter of name, fallback to email, then to "?"
  const initial = user?.name?.charAt(0)?.toUpperCase() || 
                 user?.email?.charAt(0)?.toUpperCase() || 
                 "?";
  
  const sizeClasses = {
    small: "h-8 w-8 text-sm",
    default: "h-10 w-10 text-base",
    large: "h-12 w-12 text-lg"
  };
  
  return (
    <div className={`relative flex items-center justify-center rounded-full ${sizeClasses[size]}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
      <span className="relative font-semibold text-white">
        {initial}
      </span>
    </div>
  );
};

export default UserAvatar;