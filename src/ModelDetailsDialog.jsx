import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, AlertCircle, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const ModelDetailsDialog = ({ model, isOpen, onClose }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!model) return null;

  const version = model.modelVersions?.[0];
  const triggerWords = version?.trainedWords || [];
  const description = model.description || 'No description available';
  const images = version?.images || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <ImageGallery images={images} />

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

          {/* Description Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Description</h3>
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

export default ModelDetailsDialog;