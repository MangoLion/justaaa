import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Image as ImageIcon, Activity, Clock, Star, ChevronLeft, ChevronRight, Loader2, Server } from "lucide-react";

const ModelCard = ({ model, onClick }) => (
  <div 
    className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-background hover:bg-accent"
    onClick={() => onClick(model)}
  >
    <h3 className="font-semibold truncate text-sm mb-3">{model.name}</h3>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-1" />
          <span>Workers</span>
        </div>
        <span className="font-medium">{model.count}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center">
          <Activity className="w-4 h-4 mr-1" />
          <span>Performance</span>
        </div>
        <span className="font-medium">{model.performance || 'N/A'}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>ETA</span>
        </div>
        <span className="font-medium">{model.eta || 'N/A'}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center">
          <Server className="w-4 h-4 mr-1" />
          <span>Queue</span>
        </div>
        <span className="font-medium">{model.queued || '0'}</span>
      </div>
    </div>
  </div>
);

const ImageGallery = ({ images, isLoading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ModelDetailModal = ({ model, isOpen, onClose, onSelect }) => {
  const [modelDetails, setModelDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchModelDetails = async () => {
      if (!model) return;
      
      setIsLoading(true);
      try {
        const searchName = model.name
          .replace(/\([^)]*\)/g, '')
          .replace(/[._-]/g, ' ')
          .trim();
        
        const response = await fetch(`https://civitai.com/api/v1/models?limit=1&nsfw=true&query=${encodeURIComponent(searchName)}`);
        if (!response.ok) throw new Error('Failed to fetch model data');
        
        const data = await response.json();
        if (data.items?.[0]) {
          setModelDetails(data.items[0]);
        } else {
          setModelDetails(null);
        }
      } catch (error) {
        console.error('Error fetching model details:', error);
        setModelDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && model) {
      fetchModelDetails();
    }
  }, [model, isOpen]);

  if (!model) return null;

  const images = modelDetails?.modelVersions?.[0]?.images || [];
  const description = modelDetails?.description || 'No description available';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          <ImageGallery images={images} isLoading={isLoading} />
          
          <Button 
            className="w-full"
            onClick={() => {
              onSelect(model.name);
              onClose();
            }}
          >
            Select Model
          </Button>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
              <Users className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Workers</p>
                <p className="text-lg">{model.count}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
              <Activity className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-lg">{model.performance || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
              <Clock className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">ETA</p>
                <p className="text-lg">{model.eta || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
              <Server className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Queue</p>
                <p className="text-lg">{model.queued || '0'}</p>
              </div>
            </div>
          </div>

          {model.queued > 0 && (
            <Alert>
              <AlertDescription>
                Currently {model.queued} jobs in queue
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold">Description</h4>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AIHordeModelPicker = ({ isOpen, onClose, onSelect, activeModels }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('count');
  const [selectedModel, setSelectedModel] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const sortedModels = [...activeModels].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return b[sortBy] - a[sortBy];
  });

  const filteredModels = sortedModels.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModelClick = (model) => {
    setSelectedModel(model);
    setIsDetailModalOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[800px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select an AI Horde Model</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 flex space-x-2">
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="count">Workers</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="eta">ETA</SelectItem>
              <SelectItem value="queued">Queue Size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-grow pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredModels.map(model => (
              <ModelCard 
                key={model.name} 
                model={model}
                onClick={handleModelClick}
              />
            ))}
          </div>
        </ScrollArea>

        <ModelDetailModal
          model={selectedModel}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onSelect={onSelect}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AIHordeModelPicker;