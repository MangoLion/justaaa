import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ImageDetailsModal = ({ selectedImage, setSelectedImage, setGenerationInputsFromImage, currentProject }) => {
    const isBase64Image = (str) => {
        if (typeof str !== 'string' || str.trim() === '') {
          return false;
        }
        return str.startsWith('data:image') || str.startsWith('/9j/');
    };

    // Add navigation functions
    const navigateImages = (direction) => {
      if (!currentProject?.images?.length || !selectedImage) return;
      
      const currentIndex = currentProject.images.findIndex(img => img.id === selectedImage.id);
      if (currentIndex === -1) return;
      
      let newIndex;
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % currentProject.images.length;
      } else {
        newIndex = (currentIndex - 1 + currentProject.images.length) % currentProject.images.length;
      }
      
      setSelectedImage(currentProject.images[newIndex]);
    };

    // Add keyboard event listener
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') {
          navigateImages('prev');
        } else if (e.key === 'ArrowRight') {
          navigateImages('next');
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage, currentProject]);

    const downloadImage = (option) => {
      if (option === 'no_metadata') {
        fetch(selectedImage.url)
          .then(response => response.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            downloadWithData(url, `image_${selectedImage.id}.png`);
            URL.revokeObjectURL(url);
          });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        let metadata;
        if (option === 'with_gen_info') {
          metadata = Object.fromEntries(
            Object.entries(selectedImage.generationInputs)
              .filter(([_, value]) => !isBase64Image(value))
          );
        } else {
          metadata = selectedImage.generationInputs;
        }

        const encoder = new TextEncoder();
        const metadataArray = encoder.encode(JSON.stringify(metadata));

        const chunkType = 'tEXt';
        const keyword = 'Comment';
        const chunkData = new Uint8Array([
          ...encoder.encode(keyword), 0,
          ...metadataArray
        ]);

        const crc = calculateCRC(chunkType, chunkData);

        const chunk = new Uint8Array([
          (chunkData.length >> 24) & 0xff,
          (chunkData.length >> 16) & 0xff,
          (chunkData.length >> 8) & 0xff,
          chunkData.length & 0xff,
          ...encoder.encode(chunkType),
          ...chunkData,
          (crc >> 24) & 0xff,
          (crc >> 16) & 0xff,
          (crc >> 8) & 0xff,
          crc & 0xff
        ]);

        const existingData = atob(canvas.toDataURL('image/png').split(',')[1]);
        const existingArray = new Uint8Array(existingData.length);
        for (let i = 0; i < existingData.length; i++) {
          existingArray[i] = existingData.charCodeAt(i);
        }

        const iendIndex = existingArray.findIndex((value, index, array) => {
          return array[index] === 73 && array[index + 1] === 69 && array[index + 2] === 78 && array[index + 3] === 68;
        });

        const newData = new Uint8Array([
          ...existingArray.slice(0, iendIndex - 4),
          ...chunk,
          ...existingArray.slice(iendIndex - 4)
        ]);

        const base64 = btoa(String.fromCharCode.apply(null, newData));
        downloadWithData(`data:image/png;base64,${base64}`, `image_${selectedImage.id}_with_metadata.png`);
      };
      img.src = selectedImage.url;
    };

    const downloadWithData = (dataUrl, fileName) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const calculateCRC = (type, data) => {
      const crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[i] = c;
      }

      let crc = 0xffffffff;
      const typeArray = new TextEncoder().encode(type);
      for (let i = 0; i < typeArray.length; i++) {
        crc = crcTable[(crc ^ typeArray[i]) & 0xff] ^ (crc >>> 8);
      }
      for (let i = 0; i < data.length; i++) {
        crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
      }
      return crc ^ 0xffffffff;
    };

    return (
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-6xl p-0">
          <DialogTitle className="hidden">{`Image Details - Generated Image ${selectedImage?.id}`}</DialogTitle>
          <div className="flex h-[80vh]">
            <div className="flex-grow relative bg-black">
              <img 
                src={selectedImage?.url} 
                alt={`Generated image ${selectedImage?.id}`} 
                className="w-full h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => navigateImages('prev')}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => navigateImages('next')}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Download options">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => downloadImage('no_metadata')}>
                      No metadata
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadImage('with_gen_info')}>
                      With generation info
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadImage('full_gen_data')}>
                      Full generation data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="w-1/3 bg-gray-100 dark:bg-gray-800 flex flex-col">
  <div className="p-4 flex-grow flex flex-col min-h-0">
    <h3 className="text-lg font-bold mb-2">Generation Parameters</h3>
    <ScrollArea className="flex-grow">
      <div className="space-y-2 pr-4">
        {selectedImage && Object.entries(selectedImage.generationInputs).map(([key, value]) => (
          <div key={key}>
            <Label>{key}</Label>
            {isBase64Image(value) ? (
              <img src={value} alt={key} className="w-full h-auto mt-1" />
            ) : (
              <p className="text-sm text-muted-foreground break-words">
                {value === undefined ? 'undefined' : typeof value === 'object' ? JSON.stringify(value) : value.toString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
              
              <div className="p-4 border-t bg-gray-100 dark:bg-gray-800">
                <div className="flex justify-end space-x-2">
                  <Button onClick={() => setSelectedImage(null)}>Close</Button>
                  <Button onClick={setGenerationInputsFromImage}>Use Parameters</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
};

export default ImageDetailsModal;