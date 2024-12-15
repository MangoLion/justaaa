import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Copy, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DOMPurify from 'dompurify';

const ImageGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <ImageIcon className="w-16 h-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-muted rounded-lg">
      <img 
        src={images[currentIndex].url}
        alt={`Preview ${currentIndex + 1}`}
        className="w-full h-full object-contain rounded-lg"
      />
      
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
            onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-primary/30'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const getImageUrl = (model) => {
  if (model?.modelVersions?.[0]?.images?.[0]?.url) {
    return model.modelVersions[0].images[0].url;
  }
  return '/api/placeholder/200/200';
};

const ModelCard = ({ model, onClick }) => (
  <Card className="cursor-pointer" onClick={() => onClick(model)}>
    <CardContent className="p-4">
      <img src={getImageUrl(model)} alt={model.name} className="w-full h-40 object-cover mb-2" />
      <h3 className="text-lg font-semibold">{model.name}</h3>
    </CardContent>
  </Card>
);

const ModelDetails = ({ model, onClose, onSelect }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    if (model?.modelVersions?.length > 0) {
      setSelectedVersion(model.modelVersions[0]);
    }
  }, [model]);

  if (!model) return null;

  const versions = model.modelVersions || [];
  const triggerWords = selectedVersion?.trainedWords || [];
  const description = DOMPurify.sanitize(model.description || 'No description available');
  const images = selectedVersion?.images || [];

  const handleSelect = () => {
    onSelect({
      ...model,
      selectedVersion
    });
  };

  return (
    <Dialog open={!!model} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Version Selection */}
          {model.type === "LORA" && versions.length > 0 && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="version-select">Version</Label>
              <Select
                value={selectedVersion?.id?.toString()}
                onValueChange={(value) => {
                  const version = versions.find(v => v.id.toString() === value);
                  setSelectedVersion(version);
                }}
              >
                <SelectTrigger id="version-select">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem 
                      key={version.id} 
                      value={version.id.toString()}
                    >
                      {version.name} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Select Model Button - Moved to top */}
          <Button onClick={handleSelect} className="w-full">
            Select Model
          </Button>

          {/* Image Gallery */}
          <ImageGallery images={images} />

          {/* Preview of model info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Type: {model.type || 'N/A'}</span>
            <span>Downloads: {model.stats?.downloadCount || 'N/A'}</span>
            <span>Rating: {model.stats?.rating ? model.stats.rating.toFixed(2) : 'N/A'}</span>
          </div>

          {/* Collapsible Details Section */}
          <div className="space-y-6">
            {/* Trigger Words Section */}
            {triggerWords.length > 0 && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Trigger Words</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(triggerWords.join(', '))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {triggerWords.map((word, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-background rounded-lg px-3 py-1 text-sm group"
                      >
                        <span className="mr-2">{word}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(word)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {model.type === "LORA" && !triggerWords.length && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No trigger words specified for this LoRA model
                </AlertDescription>
              </Alert>
            )}

            {/* Model Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Model Information</h3>
              <div className="space-y-2">
                <p>Creator: {model.creator?.username || 'Unknown'}</p>
                {selectedVersion && (
                  <p>Version: {selectedVersion.name}</p>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Description</h3>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CivitAISearch = ({ modelType, onModelSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNSFW, setShowNSFW] = useState(false);

  const searchModels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://civitai.com/api/v1/models?limit=20&types=${modelType}&nsfw=${showNSFW}&query=${searchQuery}`);
      const data = await response.json();
      setModels(data.items);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
    setLoading(false);
  }, [searchQuery, modelType, showNSFW]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchModels();
      } else {
        setModels([]);
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, modelType, showNSFW, searchModels]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-4 mb-4">
        <Input
          type="text"
          placeholder={`Search ${modelType}s...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="nsfw-mode"
            checked={showNSFW}
            onCheckedChange={setShowNSFW}
          />
          <Label htmlFor="nsfw-mode">Show NSFW</Label>
        </div>
      </div>
      {loading && <p>Loading...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {models.map(model => (
          <ModelCard key={model.id} model={model} onClick={setSelectedModel} />
        ))}
      </div>
      <ModelDetails 
        model={selectedModel} 
        onClose={() => setSelectedModel(null)} 
        onSelect={onModelSelect}
      />
    </div>
  );
};

export default CivitAISearch;