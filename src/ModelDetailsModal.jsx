import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { Download } from 'lucide-react';
import ModelViewer from './ModelViewer';

const ModelDetailsModal = ({ selectedModel, setSelectedModel }) => {
  const [modelData, setModelData] = useState(null);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#333333');

  useEffect(() => {
    if (selectedModel?.modelData) {
      // Create URL from binary data
      const blob = new Blob([selectedModel.modelData], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      setModelData({
        data: url,
        type: 'model/gltf-binary'
      });

      // Cleanup function to revoke object URL
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [selectedModel?.modelData]);

  if (!selectedModel) return null;

  const handleDownload = () => {
    if (selectedModel.modelData) {
      const blob = new Blob([selectedModel.modelData], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `model_${selectedModel.id}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
      <DialogContent className="w-11/12 max-w-4xl h-auto max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogTitle className="hidden">{`3D Model Details - Model ${selectedModel.id}`}</DialogTitle>
        <div className="flex flex-col space-y-4">
          {/* Controls */}
          <div className="flex justify-end items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
                title="Background Color"
                aria-label="Background Color"
              />
              <Label>Background</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="wireframe-mode"
                checked={showWireframe}
                onCheckedChange={setShowWireframe}
                aria-label="Toggle wireframe mode"
              />
              <Label htmlFor="wireframe-mode">Wireframe</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="grid-mode"
                checked={showGrid}
                onCheckedChange={setShowGrid}
                aria-label="Toggle grid mode"
              />
              <Label htmlFor="grid-mode">Grid</Label>
            </div>
          </div>

          {/* 3D Model Viewer */}
          <div className="w-full h-[300px] md:h-[500px] flex items-center justify-center" role="region" aria-label="3D Model Viewer">
            {modelData && (
              <div className="w-full h-full flex items-center justify-center">
                <ModelViewer 
                  model={modelData} 
                  modelType="glb"
                  showWireframe={showWireframe}
                  showGrid={showGrid}
                  backgroundColor={backgroundColor}
                />
              </div>
            )}
          </div>

          {/* Download Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleDownload}
              className="flex items-center space-x-2"
              size="sm"
              aria-label="Download GLB model file"
            >
              <Download className="h-4 w-4" />
              <span>Download GLB</span>
            </Button>
          </div>

          {/* Generation Parameters */}
          {selectedModel.generationInputs && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Generation Parameters</h3>
              <pre className="bg-secondary p-2 md:p-4 rounded-lg overflow-auto text-sm md:text-base max-h-32 md:max-h-48">
                {JSON.stringify(selectedModel.generationInputs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelDetailsModal;