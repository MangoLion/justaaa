import { useEffect, useState, memo } from 'react';
import { Star, Trash2, AlertTriangle, Clock, Box } from 'lucide-react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

const GalleryItem = memo(({ 
  item,
  isSelected,
  isStarred,
  onSelect,
  onStar,
  onRemove,
  onClick,
  onFailedClick
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  // Create and cleanup blob URL for 3D preview
  useEffect(() => {
    if (item.type === '3d' && item.previewData) {
      const url = URL.createObjectURL(item.previewData);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item.previewData]);

  return (
    <Card className="relative">
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </div>
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onStar}
        >
          <Star className={`h-4 w-4 ${isStarred ? 'text-yellow-400' : ''}`} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {item.type === '3d' ? (
        <>
          <video 
            src={previewUrl} 
            className="w-full h-40 object-cover cursor-pointer"
            style={{ opacity: item.status === 'completed' ? 1 : 0.5 }}
            onClick={() => onClick(item)}
            onMouseEnter={(e) => {
              if (e.target.src) {
                e.target.play().catch(err => console.warn('Video play failed:', err));
              }
            }}
            onMouseLeave={(e) => {
              e.target.pause();
              e.target.currentTime = 0;
            }}
            muted
            playsInline
          />
          <div className="absolute bottom-2 right-2 z-10">
            <Box className="h-4 w-4 text-white drop-shadow-lg" />
          </div>
        </>
      ) : (
        <img 
          src={item.url} 
          alt={`Generated ${item.id}`} 
          className="w-full h-40 object-cover cursor-pointer"
          style={{ opacity: item.status === 'completed' ? 1 : 0.5 }}
          onClick={() => onClick(item)}
        />
      )}

      {(item.status === 'generating' || item.status === 'processing') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
          {item.waitTime ? (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="text-xl">{Math.ceil(item.waitTime)}s</span>
            </div>
          ) : item.statusMessage ? (
            <div className="text-sm text-center px-2">
              {item.statusMessage}
            </div>
          ) : null}
        </div>
      )}
      {item.status === 'failed' && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50 text-white cursor-pointer"
          onClick={() => onFailedClick(item)}
        >
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Generation Failed
          </div>
        </div>
      )}
    </Card>
  );
});

GalleryItem.displayName = 'GalleryItem';

export default GalleryItem;