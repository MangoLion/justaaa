import { Star, Trash2, AlertTriangle, Clock, Box } from 'lucide-react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { useEffect, useState } from 'react';

const ImageGrid = ({ 
  images, 
  selectedImages,
  starredImages,
  onImageSelect,
  onImageStar,
  onImageRemove,
  onImageClick,
  onModelClick,
  onFailedGenerationClick
}) => {
  // Keep track of created blob URLs
  const [previewUrls, setPreviewUrls] = useState({});

  // Create and cleanup blob URLs
  useEffect(() => {
    const newPreviewUrls = {};
    const existingIds = new Set(images.map(item => item.id));
    
    // Cleanup old URLs for items that are no longer in the images array
    Object.entries(previewUrls).forEach(([id, url]) => {
      if (!existingIds.has(parseInt(id))) {
        URL.revokeObjectURL(url);
        delete newPreviewUrls[id];
      } else {
        // Keep existing URLs for items still in the images array
        newPreviewUrls[id] = url;
      }
    });

    // Create new URLs only for items that don't have one
    images.forEach(item => {
      if (item.type === '3d' && item.previewData && !newPreviewUrls[item.id]) {
        newPreviewUrls[item.id] = URL.createObjectURL(item.previewData);
      }
    });

    setPreviewUrls(newPreviewUrls);

    // Cleanup function
    return () => {
      // Only revoke URLs that aren't in the current images array
      Object.entries(previewUrls).forEach(([id, url]) => {
        if (!existingIds.has(parseInt(id))) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]); // Only depend on images array

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {[...images].reverse().map(item => (
        <Card key={item.id} className="relative">
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedImages[item.id] || false}
              onCheckedChange={() => onImageSelect(item.id)}
            />
          </div>
          <div className="absolute top-2 right-2 z-10 flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onImageStar(item.id)}
            >
              <Star className={`h-4 w-4 ${starredImages[item.id] ? 'text-yellow-400' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onImageRemove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {item.type === '3d' ? (
            <>
              <video 
                src={previewUrls[item.id]} 
                className="w-full h-40 object-cover cursor-pointer"
                style={{ opacity: item.status === 'completed' ? 1 : 0.5 }}
                onClick={() => onImageClick(item)}
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
              onClick={() => onImageClick(item)}
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
              onClick={() => onFailedGenerationClick(item)}
            >
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Generation Failed
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ImageGrid;
