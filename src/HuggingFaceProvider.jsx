import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import CustomSizeDialog, { aspectRatios } from './CustomSizeDialog';

const ModelCard = ({ model, onSelect }) => (
  <div 
    className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
    onClick={() => onSelect(model.id, model.id)}
  >
    <h3 className="font-semibold truncate">{model.id}</h3>
    <p className="text-sm text-gray-500">Likes: {model.likes}</p>
    <p className="text-sm text-gray-500">Downloads: {model.downloads}</p>
    <p className="text-sm text-gray-500">Trending Score: {model.trendingScore}</p>
    <p className="text-sm text-gray-500">Updated: {new Date(model.createdAt).toLocaleDateString()}</p>
  </div>
);

export const HuggingFaceProvider = ({ inputs, setInputs, selectedModel, setSelectedModel }) => {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trendingScore');
  const [loading, setLoading] = useState(false);
  const [selectedModelName, setSelectedModelName] = useState('');
  const [useNegativePrompt, setUseNegativePrompt] = useState(false);
  const [selectedTask, setSelectedTask] = useState('text-to-image');

  

  useEffect(() => {
    if (isModelSelectorOpen) {
      fetchModels();
    }
  }, [isModelSelectorOpen, selectedTask]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const warmResponse = await fetch(`https://huggingface.co/api/models?&pipeline_tag=${selectedTask}&library=diffusers&inference=warm`);
      const coldResponse = await fetch(`https://huggingface.co/api/models?&pipeline_tag=${selectedTask}&library=diffusers&inference=cold`);
      
      const warmData = await warmResponse.json();
      const coldData = await coldResponse.json();
      
      // Combine and deduplicate the results
      const combinedData = [...warmData, ...coldData];
      const uniqueData = Array.from(new Set(combinedData.map(model => model.id)))
        .map(id => combinedData.find(model => model.id === id));
      
      setModels(uniqueData);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (modelId, modelName) => {
    setSelectedModel(modelId);
    setSelectedModelName(modelName);
    setIsModelSelectorOpen(false);
  };

  const filteredAndSortedModels = models
    .filter(model => 
      model.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'id':
          return a.id.localeCompare(b.id);
        case 'downloads':
          return b.downloads - a.downloads;
        case 'likes':
          return b.likes - a.likes;
        case 'trendingScore':
          return b.trendingScore - a.trendingScore;
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

  return (
    <>
      <div>
        <Label htmlFor="modelSelect">Model</Label>
        <Button 
          onClick={() => setIsModelSelectorOpen(true)} 
          className="w-full justify-between"
          variant="outline"
        >
          {selectedModelName || "Select a model"}
        </Button>
      </div>

      <Dialog open={isModelSelectorOpen} onOpenChange={setIsModelSelectorOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Select a HuggingFace Model</DialogTitle>
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
                <SelectItem value="id">Name</SelectItem>
                <SelectItem value="downloads">Downloads</SelectItem>
                <SelectItem value="likes">Likes</SelectItem>
                <SelectItem value="trendingScore">Trending Score</SelectItem>
                <SelectItem value="createdAt">Last Updated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select task..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-to-image">Text to Image</SelectItem>
                <SelectItem value="image-to-image">Image to Image</SelectItem>
                <SelectItem value="inpainting">Inpainting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <p>Loading models...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredAndSortedModels.map(model => (
                  <ModelCard key={model.id} model={model} onSelect={handleModelSelect} />
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div>
        <Label htmlFor="promptTemplate">Prompt Template</Label>
        <Textarea 
          id="promptTemplate" 
          value={inputs.promptTemplate} 
          onChange={(e) => setInputs({...inputs, promptTemplate: e.target.value})}
          className="min-h-[100px] resize-y"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="useNegativePrompt"
          checked={useNegativePrompt}
          onCheckedChange={setUseNegativePrompt}
        />
        <Label htmlFor="useNegativePrompt">Enable Negative Prompt</Label>
      </div>

      {useNegativePrompt && (
        <div>
          <Label htmlFor="negativePrompt">Negative Prompt</Label>
          <Textarea 
            id="negativePrompt" 
            value={inputs.negativePrompt} 
            onChange={(e) => setInputs({...inputs, negativePrompt: e.target.value})}
            className="min-h-[100px] resize-y"
          />
        </div>
      )}
      <div>
        <Label htmlFor="guidanceScale">Guidance Scale: {inputs.guidanceScale}</Label>
        <Slider
          id="guidanceScale"
          min={1}
          max={20}
          step={0.1}
          value={[inputs.guidanceScale]}
          onValueChange={(value) => setInputs({...inputs, guidanceScale: value[0]})}
        />
      </div>
      <div>
        <Label htmlFor="numInferenceSteps">Inference Steps: {inputs.numInferenceSteps}</Label>
        <Slider
          id="numInferenceSteps"
          min={1}
          max={150}
          step={1}
          value={[inputs.numInferenceSteps]}
          onValueChange={(value) => setInputs({...inputs, numInferenceSteps: value[0]})}
        />
      </div>
      <div>
        <Label htmlFor="width">Width</Label>
        <Input 
          id="width" 
          type="number" 
          value={inputs.width} 
          onChange={(e) => setInputs({...inputs, width: Number(e.target.value)})} 
          min={128} 
          max={1024} 
          step={8} 
        />
      </div>
      <div>
        <Label htmlFor="height">Height</Label>
        <Input 
          id="height" 
          type="number" 
          value={inputs.height} 
          onChange={(e) => setInputs({...inputs, height: Number(e.target.value)})} 
          min={128} 
          max={1024} 
          step={8} 
        />
      </div>
      <div>
        <Label htmlFor="seed">Seed (optional)</Label>
        <Input 
          id="seed" 
          type="number" 
          value={inputs.seed} 
          onChange={(e) => setInputs({...inputs, seed: e.target.value})} 
          min={0} 
          max={2147483647} 
        />
      </div>
      {!inputs.seed && (
        <div>
          <Label htmlFor="batchCount">Batch Count: {inputs.batchCount}</Label>
          <Slider
            id="batchCount"
            min={1}
            max={10}
            step={1}
            value={[inputs.batchCount]}
            onValueChange={(value) => setInputs({...inputs, batchCount: value[0]})}
          />
        </div>
      )}
    </>
  );
};

const DEFAULT_INPUTS = {
  promptTemplate: '',
  guidanceScale: 7.5,
  numInferenceSteps: 50,
  width: 512,
  height: 512,
  seed: '',
  batchCount: 1,
  negativePrompt: '',
};

export const DEFAULT_GEN_PARAMS = DEFAULT_INPUTS;

export const generateContent = async (apiKey, selectedModel, generationInputs) => {
  const body = {
    inputs: generationInputs.promptTemplate,
    parameters: {
      guidance_scale: generationInputs.guidanceScale,
      num_inference_steps: generationInputs.numInferenceSteps,
      width: generationInputs.width,
      height: generationInputs.height,
      seed: generationInputs.seed ? parseInt(generationInputs.seed) : Math.floor(Math.random() * 2147483647)
    }
  };

  if (generationInputs.useNegativePrompt && generationInputs.negativePrompt) {
    body.parameters.negative_prompt = generationInputs.negativePrompt;
  }

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${selectedModel}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  return { type: 'image', content: base64 };
};