import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const GenerationErrorDialog = ({ isOpen, onClose, error, generationInputs }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-500">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Generation Error
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {error && typeof error === 'string' ? error : 'An unknown error occurred'}
            </AlertDescription>
          </Alert>

          <div>
            <h3 className="font-medium mb-2">Generation Inputs:</h3>
            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(generationInputs, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerationErrorDialog;
