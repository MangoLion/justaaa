import { Play, KeyRound, Upload, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import ThemeToggle from './ThemeToggle';
import { useRef, useState, useEffect } from 'react';

const GenerationControls = ({ 
  generateContent, 
  openApiKeyDialog, 
  generationInputs,
  selectedProvider
}) => {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const providerLinks = {
    fyrean: "https://github.com/microsoft/TRELLIS",
    aihorde: "https://aihorde.net",
    huggingface: "https://huggingface.co"
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const isGenerateDisabled = () => {
    if (selectedProvider === 'fyrean') {
      return !selectedImage;
    }
    return !generationInputs.promptTemplate?.trim();
  };

  return (
    <div className="bg-gray-200 dark:bg-gray-900 p-1 border-b border-gray-300 dark:border-gray-700">
      <div className="flex flex-col space-y-2">
        {selectedProvider === 'fyrean' ? (
          <>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => generateContent(selectedImage)} 
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white" 
                style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}
                disabled={isGenerateDisabled()}
              >
                <Play className="mr-2 h-4 w-4" /> Generate 3D
              </Button>
              {selectedProvider !== 'fyrean' && <Button 
                onClick={openApiKeyDialog} 
                variant="outline" 
                size="icon"
              >
                <KeyRound className="h-4 w-4" />
              </Button>}
              <ThemeToggle />
            </div>
            <div 
              className={`
                relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors h-40
                ${isDragging 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}
                ${imagePreview ? 'overflow-hidden' : ''}
              `}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {imagePreview && (
                <>
                  <div 
                    className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-50"
                    style={{ backgroundImage: `url(${imagePreview})` }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              <div className={`relative flex flex-col items-center justify-center h-full ${imagePreview ? 'bg-black/30 -m-4' : ''}`}>
                <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-green-500' : imagePreview ? 'text-white' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDragging ? 'text-green-600 dark:text-green-400' : imagePreview ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {selectedImage 
                    ? selectedImage.name 
                    : isDragging 
                      ? "Drop image here" 
                      : "Click or drag & drop an image"}
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*"
              />
            </div>

            <div className="text-center">
            <a 
              href="https://github.com/microsoft/TRELLIS" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
                TRELLIS
              </h3>
            </a>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => generateContent()}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white" 
                style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}
                disabled={isGenerateDisabled()}
              >
                <Play className="mr-2 h-4 w-4" /> Generate
              </Button>
              <Button 
                onClick={openApiKeyDialog} 
                variant="outline" 
                size="icon"
                disabled={selectedProvider === 'fyrean'}
              >
                <KeyRound className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>

            <div className="text-center">
            <a 
              href={providerLinks[selectedProvider]}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
                {selectedProvider.toUpperCase()}
              </h3>
            </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GenerationControls;
