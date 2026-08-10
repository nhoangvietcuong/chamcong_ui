import React from 'react';
import clsx from 'clsx';

export const Avatar = ({ name = '', size = 'md', className }) => {
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const initials = getInitials(name);

  const getPastelColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 60%, 65%)`;
  };

  const bgStyle = {
    backgroundColor: getPastelColor(name || 'User'),
    color: '#1e293b'
  };

  return (
    <div
      style={bgStyle}
      className={clsx(
        "rounded-full flex items-center justify-center font-bold uppercase shadow-inner shrink-0",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
};

export default Avatar;
