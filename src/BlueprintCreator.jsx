import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, Download, Upload, AlertCircle, Tags } from "lucide-react";

const BlueprintCreator = ({ isOpen, onClose, currentInputs }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [blueprintPrompt, setBlueprintPrompt] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [examplePrompts, setExamplePrompts] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (isOpen && currentInputs.promptTemplate) {
      setBlueprintPrompt(currentInputs.promptTemplate);
    }
  }, [isOpen, currentInputs.promptTemplate]);

  useEffect(() => {
    if (!isOpen) {
      setPreviewImage(null);
      setBlueprintPrompt('');
      setName('');
      setDescription('');
      setExamplePrompts('');
      setTags('');
    }
  }, [isOpen]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const downloadBlueprint = useCallback(() => {
    const { seed, workers, workerBlacklist, slowWorkers, trustedWorkers, 
      shared, replacementFilter, promptTemplate, ...relevantInputs } = currentInputs;

    const blueprint = {
      name,
      description,
      preview: previewImage,
      promptTemplate: blueprintPrompt,
      examplePrompts: examplePrompts.split('\n').filter(p => p.trim()),
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      parameters: relevantInputs
    };

    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'blueprint'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [name, description, previewImage, blueprintPrompt, examplePrompts, tags, currentInputs]);

  const isValid = Boolean(name && blueprintPrompt && blueprintPrompt.includes('<<PROMPT>>') && previewImage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Create Generation Blueprint
          </DialogTitle>
          <DialogDescription>
            Create a reusable blueprint with your current generation parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-grow pr-4 -mr-4">
          <div>
            <Label htmlFor="name">Blueprint Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Style"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this blueprint does..."
              className="h-20"
            />
          </div>

          <div>
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="portrait, landscape, anime, realistic (comma-separated)"
            />
          </div>

          <div>
            <Label htmlFor="preview">Preview Image</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => document.getElementById('preview-upload').click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Preview
                </Button>
                <Input
                  id="preview-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-xs max-h-48 object-contain rounded-md"
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="promptTemplate">Blueprint Prompt Template</Label>
            <Alert className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insert <code className="bg-muted px-1 rounded">{'<<PROMPT>>'}</code> where you want the user's prompt to appear
              </AlertDescription>
            </Alert>
            <Textarea
              id="promptTemplate"
              value={blueprintPrompt}
              onChange={(e) => setBlueprintPrompt(e.target.value)}
              placeholder="masterpiece, best quality, <<PROMPT>>, highly detailed"
              className="h-32" 
            />
          </div>

          <div>
            <Label htmlFor="examplePrompts">Example User Prompts</Label>
            <Alert className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enter one example prompt per line
              </AlertDescription>
            </Alert>
            <Textarea
              id="examplePrompts"
              value={examplePrompts}
              onChange={(e) => setExamplePrompts(e.target.value)}
              placeholder="a beautiful sunset"
              className="h-32"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 flex-shrink-0 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={downloadBlueprint}
            disabled={!isValid}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download Blueprint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlueprintCreator;