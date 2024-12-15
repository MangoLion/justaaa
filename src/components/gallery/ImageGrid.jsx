import { useEffect, useState } from 'react';
import GalleryItem from './GalleryItem';

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
        <GalleryItem
          key={item.id}
          item={item}
          previewUrl={previewUrls[item.id]}
          isSelected={selectedImages[item.id] || false}
          isStarred={starredImages[item.id] || false}
          onSelect={() => onImageSelect(item.id)}
          onStar={() => onImageStar(item.id)}
          onRemove={() => onImageRemove(item.id)}
          onClick={onImageClick}
          onFailedClick={onFailedGenerationClick}
        />
      ))}
    </div>
  );
};

export default ImageGrid;
