import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const FloatingUploadButton = ({ onUploadClick, uploadRef }) => {
  return (
    <div className="fixed bottom-4 right-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onUploadClick} 
              size="icon" 
              className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
            >
              <Upload className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload Image</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <input
        type="file"
        ref={uploadRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onUploadClick(e);
          }
        }}
        accept="image/*"
      />
    </div>
  );
};

export default FloatingUploadButton;
