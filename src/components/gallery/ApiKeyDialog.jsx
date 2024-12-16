import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from "lucide-react";
import { useState } from 'react';

const providerDescriptions = {
  aihorde: "By default, use the public community key! (It should be loaded with kudos, hopefully). Make sure its set to 'communitykey'",
  huggingface: "Create a free HF account. You get about 200 free H100 GPU seconds a day",
  fyrean: "Free provider, self hosted by some random dude"
};

const ApiKeyDialog = ({
  isOpen,
  onClose,
  selectedProvider,
  currentApiKey,
  onApiKeyChange,
  onSave
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter {selectedProvider} API Key</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                value={currentApiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your API key"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {providerDescriptions[selectedProvider] && (
            <p className="text-sm text-muted-foreground">
              {providerDescriptions[selectedProvider]}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="mr-2">
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;