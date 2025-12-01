import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <defs>
      <linearGradient id="logoGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" /> {/* violet-600 */}
        <stop offset="0.5" stopColor="#6366f1" /> {/* indigo-500 */}
        <stop offset="1" stopColor="#22d3ee" /> {/* cyan-400 */}
      </linearGradient>
    </defs>
    
    {/* Left Hemisphere (Human/Organic) */}
    <path 
      d="M12 4C10 4 8.5 4.5 7 5.5C5.5 6.5 4.5 8 4 10C3.5 12 3.5 14 4.5 16C5.5 18 7.5 20 12 21" 
      stroke="url(#logoGradient)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Right Hemisphere (AI/Circuit) */}
    <path 
      d="M12 21C16.5 20 18.5 18 19.5 16C20.5 14 20.5 12 20 10C19.5 8 18.5 6.5 17 5.5C15.5 4.5 14 4 12 4" 
      stroke="url(#logoGradient)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      strokeDasharray="3 2"
    />
    
    {/* Central Connection (Synthesis) */}
    <path d="M12 4V21" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    
    {/* Circuit Nodes */}
    <circle cx="12" cy="12.5" r="2.5" fill="url(#logoGradient)" />
    <circle cx="12" cy="12.5" r="1" fill="white" />
    
    <circle cx="8" cy="9" r="1.5" fill="url(#logoGradient)" />
    <circle cx="16" cy="9" r="1.5" fill="url(#logoGradient)" />
    <circle cx="7" cy="15" r="1.5" fill="url(#logoGradient)" />
    <circle cx="17" cy="15" r="1.5" fill="url(#logoGradient)" />
    
    {/* Connections */}
    <path d="M8 9L12 12.5L16 9" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <path d="M7 15L12 12.5L17 15" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
  </svg>
);