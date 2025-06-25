import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
}

/**
 * A simple YouTube embed component that uses an iframe
 * This is a fallback for when ReactPlayer has issues
 */
const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ 
  videoId, 
  title = 'YouTube video player', 
  className = '',
  autoplay = false
}) => {
  // Extract video ID from various YouTube URL formats
  const getVideoId = (idOrUrl: string): string => {
    // If it's already just an ID, return it
    if (/^[a-zA-Z0-9_-]{11}$/.test(idOrUrl)) {
      return idOrUrl;
    }

    // Try to extract from URL
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/;
    const match = idOrUrl.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : idOrUrl;
  };

  const embedId = getVideoId(videoId);
  const autoplayParam = autoplay ? '1' : '0';

  return (
    <div className={`relative w-full pt-[56.25%] ${className}`}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${embedId}?autoplay=${autoplayParam}&modestbranding=1&rel=0`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
