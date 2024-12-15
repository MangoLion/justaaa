import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Wrench, RefreshCw, Edit, Plus, X, Trash2, Maximize2, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import MaskEditor from './MaskEditor';
import CivitAISearch from './CivitAISearch';
import AIHordeModelPicker from './AIHordeModelPicker';
import CustomSizeDialog, { aspectRatios } from './CustomSizeDialog';
import ModelDetailsDialog from './ModelDetailsDialog';
import BlueprintCreator from './BlueprintCreator';

import ExpressMode from './ExpressMode';

const LabelWithTooltip = ({ htmlFor, children, tooltip }) => (
  <div className="flex items-center gap-2">
    <Label htmlFor={htmlFor}>{children}</Label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export const AIHordeProvider = ({ inputs, setInputs, selectedModel, setSelectedModel, onGenerate }) => {
  const [activeModels, setActiveModels] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);

  const [isBlueprintCreatorOpen, setIsBlueprintCreatorOpen] = useState(false);

  const [isLoraDialogOpen, setIsLoraDialogOpen] = useState(false);
  const [isTiDialogOpen, setIsTiDialogOpen] = useState(false);
  const [currentLora, setCurrentLora] = useState({ name: '', model: 0.5, clip: 0.5 });
  const [currentTi, setCurrentTi] = useState({ name: '', strength: 0.5 });
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);

  const [isCivitAISearchOpen, setIsCivitAISearchOpen] = useState(false);
  const [searchType, setSearchType] = useState('');

  const [isCustomSizeDialogOpen, setIsCustomSizeDialogOpen] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('Square (1:1)');

  // Function to handle aspect ratio change
  const handleAspectRatioChange = (value) => {
    setSelectedAspectRatio(value);
    const selectedRatio = aspectRatios.find(ratio => ratio.label === value);
    if (selectedRatio.width && selectedRatio.height) {
      setInputs({...inputs, width: selectedRatio.width, height: selectedRatio.height});
    } else if (value === 'Custom') {
      setIsCustomSizeDialogOpen(true);
    }
  };

  const handleCustomSizeConfirm = () => {
    setIsCustomSizeDialogOpen(false);
    setSelectedAspectRatio('Custom');
  };


  // See if we need to set 'Custom' when inputs change!
  useEffect(() => {
    const matchingRatio = aspectRatios.find(
      ratio => ratio.width === inputs.width && ratio.height === inputs.height
    );
    setSelectedAspectRatio(matchingRatio ? matchingRatio.label : 'Custom');
  }, [inputs.width, inputs.height]);

  useEffect(() => {
    if (inputs.controlType && inputs.controlType !== 'none') {
      setInputs(prevInputs => ({ ...prevInputs, sourceProcessing: 'img2img' }));
    }
  }, [inputs.controlType]);


  const [workers, setWorkers] = useState([]);
  const [newWorker, setNewWorker] = useState('');

  


  const convertToWebP = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }, 'image/webp');
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const webpBase64 = await convertToWebP(file);
        setInputs({ ...inputs, sourceImage: webpBase64 });
      } catch (error) {
        console.error('Error converting image to WebP:', error);
      }
    }
  };

  const clearSourceImage = () => {
    setInputs(prevInputs => ({
      ...prevInputs,
      sourceImage: null,
      sourceMask: null,
      controlType: 'none'
    }));
  };

  
  const handleAddWorker = () => {
    if (newWorker && workers.length < 5) {
      setWorkers([...workers, newWorker]);
      setNewWorker('');
    }
  };

  const handleRemoveWorker = (index) => {
    const newWorkers = [...workers];
    newWorkers.splice(index, 1);
    setWorkers(newWorkers);
  };

  useEffect(() => {
    if (inputs.sourceImage && inputs.sourceProcessing === 'inpainting' && !inputs.sourceMask) {
      initializeSourceMask(inputs.sourceImage);
    }
  }, [inputs.sourceImage, inputs.sourceProcessing]);

  const initializeSourceMask = (sourceImage) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setInputs({...inputs, sourceMask: canvas.toDataURL('image/webp')});
    };
    img.src = sourceImage;
  };

   useEffect(() => {
    fetchActiveModels();
  }, []);
  
  const fetchActiveModels = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('https://aihorde.net/api/v2/status/models');
      if (response.ok) {
        const data = await response.json();
        setActiveModels(data);
        
        // Check if the current selection is valid
        const isCurrentSelectionValid = data.some(model => model.name === selectedModel);
        
        // Auto-select the model with most workers if nothing is selected or current selection is invalid
        if (!selectedModel || !isCurrentSelectionValid) {
          if (data.length > 0) {
            // Sort models by worker count in descending order
            const sortedModels = [...data].sort((a, b) => {
              const aWorkers = a.count || 0; // Handle cases where count might be undefined
              const bWorkers = b.count || 0;
              return bWorkers - aWorkers;
            });
            
            // Select the model with the most workers
            const bestModel = sortedModels[0];
            console.log(`Selected model ${bestModel.name} with ${bestModel.count} workers`);
            setSelectedModel(bestModel.name);
          }
        }
      } else {
        console.error('Failed to fetch active models');
      }
    } catch (error) {
      console.error('Error fetching active models:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleModelSelect = (modelName) => {
    setSelectedModel(modelName);
    console.log("setSelectedModel:", inputs.model, modelName)
    // Also store the model name in the inputs
    setInputs(prevInputs => ({
      ...prevInputs,
      model: modelName
    }));
    setIsModelPickerOpen(false);
  };

  useEffect(() => {
    if (inputs.model && inputs.model !== selectedModel) {
      // If there's a model in the inputs that differs from selectedModel,
      // update selectedModel to match
      setSelectedModel(inputs.model);
      
    }
  }, [inputs.model, selectedModel]);


  const handleAddLora = (selectedModel) => {
    const selectedVersion = selectedModel.selectedVersion;
    if (!selectedVersion) return;
  
    setInputs({
      ...inputs,
      loras: [...inputs.loras, {
        name: selectedVersion.id.toString(), // Store version ID as name for AI Horde
        label: selectedModel.name, // Store display name separately
        model: 0.5,
        clip: 1,
        is_version: true, // Required for version ID usage
      }]
    });
    setIsCivitAISearchOpen(false);
  };

  const handleAddTi = (selectedModel) => {
    setInputs({
      ...inputs,
      tis: [...inputs.tis, { name: selectedModel.name, strength: 0.5 }]
    });
    setIsCivitAISearchOpen(false);
  };

  const updateLoraValue = (index, type, value) => {
    const newLoras = [...inputs.loras];
    newLoras[index][type] = value[0];
    setInputs({...inputs, loras: newLoras});
  };

  const updateTiValue = (index, value) => {
    const newTis = [...inputs.tis];
    newTis[index].strength = value[0];
    setInputs({...inputs, tis: newTis});
  };

  const [selectedModelDetails, setSelectedModelDetails] = useState(null);
  const [isModelDetailsOpen, setIsModelDetailsOpen] = useState(false);
  const MAX_LORAS = 5;
  const MAX_TIS = 5;
  const fetchModelDetails = async (modelName, type) => {
    try {
      const modelType = type === 'lora' ? 'LORA' : 'TextualInversion';
      // Fetch more results to increase chance of finding exact match
      const response = await fetch(`https://civitai.com/api/v1/models?limit=50&types=${modelType}&query=${encodeURIComponent(modelName)}`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Find exact name match (case insensitive)
        const exactMatch = data.items.find(
          item => item.name.toLowerCase() === modelName.toLowerCase()
        );
        
        if (exactMatch) {
          setSelectedModelDetails(exactMatch);
          setIsModelDetailsOpen(true);
        } else {
          console.log(`No exact match found for model: ${modelName}`);
          // Optionally show some user feedback that the model details couldn't be found
        }
      }
    } catch (error) {
      console.error('Error fetching model details:', error);
    }
  };

  //input check
  useEffect(() => {
    if (inputs.width < 576 || inputs.height < 576) {
      // If dimensions are too small, disable hiresFix
      setInputs(prev => ({
        ...prev,
        hiresFix: false
      }));
    }
  }, [inputs.width, inputs.height]);


  const renderExpressMode = () => {
    return (
      <div className="py-6">
        <Button 
          variant="outline" 
          className="w-full h-48 relative overflow-hidden group transition-all hover:border-primary"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 group-hover:opacity-75 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-2xl text-white">🎨</span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Select Blueprint</h3>
              <p className="text-sm text-muted-foreground">Choose a pre-configured style for your image generation</p>
            </div>
          </div>
        </Button>
      </div>
    );
  };

  const renderAdvancedMode = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <LabelWithTooltip htmlFor="modelSelect" tooltip="The AI model that will generate your images. Different models specialize in different styles and capabilities.">
              Model
            </LabelWithTooltip>
            <Button
                          onClick={() => setIsModelPickerOpen(true)}
                          className="w-full justify-between"
                          variant="outline"
                        >
                          {selectedModel || "Select a model"}
                        </Button>
          </div>
          <Button
            onClick={fetchActiveModels}
            disabled={isRefreshing}
            size="icon"
            variant="outline"
            className="mt-6"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div>
          <LabelWithTooltip htmlFor="promptTemplate" tooltip="The main text description of what you want to generate. Be specific and detailed for best results.">
            Prompt
          </LabelWithTooltip>
          <Textarea 
            id="promptTemplate" 
            value={inputs.promptTemplate} 
            onChange={(e) => setInputs({...inputs, promptTemplate: e.target.value})}
            className="min-h-[100px] resize-y"
          />
        </div>

        <div>
          <LabelWithTooltip htmlFor="negativePrompt" tooltip="Elements you want to avoid in the generated image. Use this to prevent unwanted features or qualities.">
            Negative Prompt
          </LabelWithTooltip>
          <Textarea 
            id="negativePrompt" 
            value={inputs.negativePrompt} 
            onChange={(e) => setInputs({...inputs, negativePrompt: e.target.value})}
            className="min-h-[100px] resize-y"
          />
        </div>

        <div>
          <LabelWithTooltip htmlFor="seed" tooltip="A number that determines the initial randomness. Using the same seed with identical settings will produce similar results.">
            Seed (optional)
          </LabelWithTooltip>
          <Input 
            id="seed" 
            value={inputs.seed} 
            onChange={(e) => setInputs({...inputs, seed: e.target.value})} 
            placeholder="Leave empty for random seed"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
          <Label>LoRAs ({inputs.loras.length}/{MAX_LORAS})</Label>
          <Button 
            onClick={() => {
              setSearchType('LORA');
              setIsCivitAISearchOpen(true);
            }} 
            variant="outline" 
            size="sm"
            disabled={inputs.loras.length >= MAX_LORAS}
            className="ml-4"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {inputs.loras.map((lora, index) => (
          <div key={index} className="space-y-2 border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => fetchModelDetails(lora.label, 'lora')}
                className="font-medium hover:underline text-left"
              >
                {lora.label}
              </button>
              <Button 
                onClick={() => {
                  const newLoras = [...inputs.loras];
                  newLoras.splice(index, 1);
                  setInputs({...inputs, loras: newLoras});
                }} 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Model: {lora.model.toFixed(2)}</Label>
                <Slider
                  min={-5}
                  max={5}
                  step={0.01}
                  value={[lora.model]}
                  onValueChange={(value) => updateLoraValue(index, 'model', value)}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">CLIP: {lora.clip.toFixed(2)}</Label>
                <Slider
                  min={-5}
                  max={5}
                  step={0.01}
                  value={[lora.clip]}
                  onValueChange={(value) => updateLoraValue(index, 'clip', value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Textual Inversions ({inputs.tis.length}/{MAX_TIS})</Label>
          <Button 
            onClick={() => {
              setSearchType('TextualInversion');
              setIsCivitAISearchOpen(true);
            }} 
            variant="outline" 
            size="sm"
            disabled={inputs.tis.length >= MAX_TIS}
            className="ml-4"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {inputs.tis.map((ti, index) => (
          <div key={index} className="space-y-2 border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => fetchModelDetails(ti.name, 'ti')}
                className="font-medium hover:underline text-left"
              >
                {ti.name}
              </button>
              <Button 
                onClick={() => {
                  const newTis = [...inputs.tis];
                  newTis.splice(index, 1);
                  setInputs({...inputs, tis: newTis});
                }} 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Strength: {ti.strength.toFixed(2)}</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[ti.strength]}
                onValueChange={(value) => updateTiValue(index, value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
      <LabelWithTooltip htmlFor="steps" tooltip="The number of denoising steps. Higher values generally produce better quality but take longer.">
            Steps: {inputs.steps}
          </LabelWithTooltip>
          <Slider
            id="steps"
            min={1}
            max={150}
            step={1}
            value={[inputs.steps]}
            onValueChange={(value) => setInputs({...inputs, steps: value[0]})}
          />
        </div>

        <div>
          <LabelWithTooltip htmlFor="cfgScale" tooltip="How closely the image follows your prompt. Higher values produce images more literally matching your prompt but may be less creative.">
            CFG Scale: {inputs.cfgScale}
          </LabelWithTooltip>
          <Slider
            id="cfgScale"
            min={1}
            max={30}
            step={0.1}
            value={[inputs.cfgScale]}
            onValueChange={(value) => setInputs({...inputs, cfgScale: value[0]})}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="tiling"
            checked={inputs.tiling}
            onCheckedChange={(checked) => setInputs({...inputs, tiling: checked})}
          />
          <LabelWithTooltip htmlFor="tiling" tooltip="Creates images that can be seamlessly tiled in a repeating pattern.">
            Enable Seamless Tiling
          </LabelWithTooltip>
        </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="transparent"
          checked={inputs.transparent}
          onCheckedChange={(checked) => setInputs({...inputs, transparent: checked})}
        />
        <Label htmlFor="transparent">Enable Transparent Background</Label>
      </div>

      <div className="flex gap-2">
  <div className="flex-grow">
    <Label htmlFor="aspectRatio">Image Size</Label>
    <Select 
      onValueChange={handleAspectRatioChange}
      value={selectedAspectRatio}
    >
      <SelectTrigger id="aspectRatio">
        <SelectValue placeholder="Select image size" />
      </SelectTrigger>
      <SelectContent>
        {aspectRatios.map((ratio) => (
          <SelectItem key={ratio.label} value={ratio.label}>
            {ratio.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  <Button
    variant="outline"
    size="icon"
    className="mt-6"
    onClick={() => {
      setSelectedAspectRatio('Custom');
      setIsCustomSizeDialogOpen(true);
    }}
  >
    <Maximize2 className="h-4 w-4" />
  </Button>
</div>
<div className="mt-2 text-sm text-gray-500">
    Resolution: {inputs.width}x{inputs.height}
  </div>

        <div>
          <Label htmlFor="sampler">Sampler</Label>
        <Select 
          value={inputs.sampler} 
          onValueChange={(value) => setInputs({...inputs, sampler: value})}
        >
          <SelectTrigger id="sampler">
            <SelectValue placeholder="Select a sampler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="k_euler_a">Euler Ancestral</SelectItem>
            <SelectItem value="k_euler">Euler</SelectItem>
            <SelectItem value="k_lms">LMS</SelectItem>
            <SelectItem value="k_heun">Heun</SelectItem>
            <SelectItem value="k_dpm_2">DPM2</SelectItem>
            <SelectItem value="k_dpm_2_a">DPM2 Ancestral</SelectItem>
            <SelectItem value="k_dpmpp_2s_a">DPM++ 2S Ancestral</SelectItem>
            <SelectItem value="k_dpmpp_2m">DPM++ 2M</SelectItem>
            <SelectItem value="k_dpmpp_sde">DPM++ SDE</SelectItem>
            <SelectItem value="DDIM">DDIM</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      {(!inputs.controlType || inputs.controlType === 'none') && (
        <div>
          <Label>Source Processing</Label>
          <ToggleGroup 
            type="single" 
            value={inputs.sourceProcessing} 
            onValueChange={(value) => value && setInputs({...inputs, sourceProcessing: value})}
            className="justify-start"
          >
            <ToggleGroupItem value="txt2img" aria-label="Text to Image">
              txt2img
            </ToggleGroupItem>
            <ToggleGroupItem value="img2img" aria-label="Image to Image">
              img2img
            </ToggleGroupItem>
            <ToggleGroupItem value="inpainting" aria-label="Inpainting">
              inpainting
            </ToggleGroupItem>
            <ToggleGroupItem value="outpainting" aria-label="Outpainting">
              outpainting
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {(!inputs.controlType || inputs.controlType === 'none') && inputs.sourceProcessing !== 'txt2img' && (
        <div>
          <Label htmlFor="sourceImage">Source Image</Label>
          <Input 
            id="sourceImage" 
            type="file" 
            onChange={(e) => handleImageUpload(e, 'sourceImage')} 
          />
           {inputs.sourceImage && (
            <div className="relative mt-2">
              <img
                src={inputs.sourceImage}
                alt="Source Image Preview"
                className="max-w-xs max-h-32 mx-auto block"
              />
              <Button
                onClick={clearSourceImage}
                variant="outline"
                size="icon"
                className="absolute top-0 left-0 m-2 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

        </div>
      )}

      {inputs.sourceProcessing === 'inpainting' && (
        <div>
          <Label htmlFor="sourceMask">Source Mask</Label>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsMaskEditorOpen(true)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Mask
            </Button>
            {inputs.sourceMask && (
              <img src={inputs.sourceMask} alt="Source Mask Preview"  className="max-w-xs max-h-32 mx-auto block"/>
            )}
          </div>
        </div>
      )}


    {inputs.sourceProcessing !== 'txt2img' && (
      <div>
        <Label htmlFor="denoisingStrength">Denoising Strength: {inputs.denoisingStrength}</Label>
        <Slider
          id="denoisingStrength"
          min={0.01}
          max={1}
          step={0.01}
          value={[inputs.denoisingStrength]}
          onValueChange={(value) => setInputs({...inputs, denoisingStrength: value[0]})}
        />
      </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="karras"
          checked={inputs.karras}
          onCheckedChange={(checked) => setInputs({...inputs, karras: checked})}
        />
        <Label htmlFor="karras">Use Karras Noise Scheduling</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="hiresFix"
          checked={inputs.hiresFix}
          onCheckedChange={(checked) => setInputs({...inputs, hiresFix: checked})}
          disabled={inputs.width < 576 || inputs.height < 576}
        />
        <div>
          <Label htmlFor="hiresFix" className={inputs.width < 576 || inputs.height < 576 ? "text-muted-foreground" : ""}>
            Enable Hires Fix
          </Label>
          {(inputs.width < 576 || inputs.height < 576) && (
            <p className="text-sm text-muted-foreground">
              req min resolution 576x576
            </p>
          )}
        </div>
      </div>

      {inputs.hiresFix && (
        <div>
          <Label htmlFor="hiresFixDenoisingStrength">Hires Fix Denoising Strength: {inputs.hiresFixDenoisingStrength}</Label>
          <Slider
            id="hiresFixDenoisingStrength"
            min={0.01}
            max={1}
            step={0.01}
            value={[inputs.hiresFixDenoisingStrength]}
            onValueChange={(value) => setInputs({...inputs, hiresFixDenoisingStrength: value[0]})}
          />
        </div>
      )}

<div className="flex items-center space-x-2">
        <Switch
          id="nsfw"
          checked={inputs.nsfw}
          onCheckedChange={(checked) => setInputs({...inputs, nsfw: checked})}
        />
        <Label htmlFor="nsfw">Allow NSFW Content</Label>
      </div>

<div>
        <Label htmlFor="controlType">ControlNet Type</Label>
        <Select 
          value={inputs.controlType} 
          onValueChange={(value) => setInputs({...inputs, controlType: value})}
        >
          <SelectTrigger id="controlType">
            <SelectValue placeholder="Select a ControlNet type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="canny">Canny</SelectItem>
            <SelectItem value="hed">HED</SelectItem>
            <SelectItem value="depth">Depth</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="openpose">OpenPose</SelectItem>
            <SelectItem value="seg">Segmentation</SelectItem>
            <SelectItem value="scribble">Scribble</SelectItem>
            <SelectItem value="fakescribbles">Fake Scribbles</SelectItem>
            <SelectItem value="hough">Hough</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {((inputs.controlType && inputs.controlType !== 'none')) && (
        <div>
          <Label htmlFor="sourceImage">ControlNet Image</Label>
          <Input 
            id="sourceImage" 
            type="file" 
            onChange={handleImageUpload} 
          />
          {inputs.sourceImage && (
            <div className="relative mt-2">
              <img
                src={inputs.sourceImage}
                alt="Source/Control Image Preview"
                className="max-w-xs max-h-32 mx-auto block"
              />
              <Button
                onClick={clearSourceImage}
                variant="outline"
                size="icon"
                className="absolute top-0 left-0 m-2 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {inputs.controlType && inputs.controlType !== 'none' && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="imageIsControl"
                    checked={inputs.imageIsControl}
                    onCheckedChange={(checked) => setInputs({...inputs, imageIsControl: checked})}
                  />
                  <Label htmlFor="imageIsControl">Source Image is Control Map</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="returnControlMap"
                    checked={inputs.returnControlMap}
                    onCheckedChange={(checked) => setInputs({...inputs, returnControlMap: checked})}
                  />
                  <Label htmlFor="returnControlMap">Return Control Map</Label>
                </div>
              </>
            )}
      
      
    {/* Face Fixer Selection */}
  <div>
  <LabelWithTooltip htmlFor="faceFixer" tooltip="Post-processing options to improve the quality of faces in the generated image.">
            Face Fixer
          </LabelWithTooltip>
          <Select 
            value={inputs.faceFixer} 
            onValueChange={(value) => setInputs({...inputs, faceFixer: value})}
          >
      <SelectTrigger id="faceFixer">
        <SelectValue placeholder="Select face fixer" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="None">None</SelectItem>
        <SelectItem value="GFPGAN">GFPGAN</SelectItem>
        <SelectItem value="CodeFormers">CodeFormers</SelectItem>
      </SelectContent>
          </Select>
        </div>

  {/* Face Fixer Strength Slider */}
  {inputs.faceFixer && inputs.faceFixer !== 'None' && (
    <div>
      <LabelWithTooltip 
        htmlFor="facefixerStrength" 
        tooltip="Controls how strongly the face fixer affects the image. Higher values produce stronger facial corrections but may alter the original style more."
      >
        Face Fixer Strength: {inputs.facefixerStrength}
      </LabelWithTooltip>
      <Slider
        id="facefixerStrength"
        min={0.01}
        max={1}
        step={0.01}
        value={[inputs.facefixerStrength]}
        onValueChange={(value) => setInputs({...inputs, facefixerStrength: value[0]})}
      />
    </div>
  )}

  {/* Upscaler Selection */}
  <div>
    <LabelWithTooltip 
      htmlFor="upscaler" 
      tooltip="AI models that increase image resolution while preserving and enhancing details. Different upscalers are optimized for different types of images (photos, anime, etc)."
    >
      Upscaler
    </LabelWithTooltip>
    <Select 
      value={inputs.upscaler} 
      onValueChange={(value) => setInputs({...inputs, upscaler: value})}
    >
      <SelectTrigger id="upscaler">
        <SelectValue placeholder="Select upscaler" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="None">None</SelectItem>
        <SelectItem value="RealESRGAN_x4plus">RealESRGAN x4 Plus</SelectItem>
        <SelectItem value="RealESRGAN_x2plus">RealESRGAN x2 Plus</SelectItem>
        <SelectItem value="RealESRGAN_x4plus_anime_6B">RealESRGAN x4 Plus Anime</SelectItem>
        <SelectItem value="NMKD_Siax">NMKD Siax</SelectItem>
        <SelectItem value="4x_AnimeSharp">4x AnimeSharp</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Strip Background Toggle */}
  <div className="flex items-center space-x-2">
    <Switch
      id="stripBackground"
      checked={inputs.stripBackground}
      onCheckedChange={(checked) => setInputs({...inputs, stripBackground: checked})}
    />
    <Label htmlFor="stripBackground">Strip Background</Label>
  </div>

      <div>
        <LabelWithTooltip 
          htmlFor="clipSkip" 
          tooltip="Controls how many layers to skip in CLIP model processing. Lower values (1-2) stay closer to the training data, while higher values can produce more artistic or stylized results. Most models are optimized for CLIP Skip 1."
        >
          CLIP Skip: {inputs.clipSkip}
        </LabelWithTooltip>
        <Slider
          id="clipSkip"
          min={1}
          max={12}
          step={1}
          value={[inputs.clipSkip]}
          onValueChange={(value) => setInputs({...inputs, clipSkip: value[0]})}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="trustedWorkers"
          checked={inputs.trustedWorkers}
          onCheckedChange={(checked) => setInputs({...inputs, trustedWorkers: checked})}
        />
        <Label htmlFor="trustedWorkers">Use Trusted Workers Only</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="shared"
          checked={inputs.shared}
          onCheckedChange={(checked) => setInputs({...inputs, shared: checked})}
        />
        <Label htmlFor="shared">Share Generated Images with LAION</Label>
      </div>

      <div>
        <Label>Workers (max 5)</Label>
        {workers.map((worker, index) => (
          <div key={index} className="flex items-center space-x-2 mt-2">
            <span>{worker}</span>
            <Button onClick={() => handleRemoveWorker(index)} variant="destructive" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {workers.length < 5 && (
          <div className="flex items-center space-x-2 mt-2">
            <Input 
              value={newWorker}
              onChange={(e) => setNewWorker(e.target.value)}
              placeholder="Enter worker ID"
            />
            <Button onClick={handleAddWorker} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="workerBlacklist"
          checked={inputs.workerBlacklist}
          onCheckedChange={(checked) => setInputs({...inputs, workerBlacklist: checked})}
        />
        <Label htmlFor="workerBlacklist">Treat Worker List as Blacklist</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="replacementFilter"
          checked={inputs.replacementFilter}
          onCheckedChange={(checked) => setInputs({...inputs, replacementFilter: checked})}
        />
        <Label htmlFor="replacementFilter">Enable Prompt Filtering</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="slowWorkers"
          checked={inputs.slowWorkers}
          onCheckedChange={(checked) => setInputs({...inputs, slowWorkers: checked})}
        />
        <Label htmlFor="slowWorkers">Allow Slow Workers</Label>
      </div>
        
      <Button 
            onClick={() => setIsBlueprintCreatorOpen(true)} 
            className="w-full relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-500/90 to-blue-400/90 group-hover:opacity-90 transition-opacity" />
            <div className="relative z-10 flex items-center justify-center space-x-2 text-white">
                <Wrench className="w-5 h-5" />
                <span className="font-medium" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
                    Create Blueprint
                </span>
            </div>
        </Button>

      </div>
    );
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="express" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="express">Express</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="express">
          <ExpressMode inputs={inputs} setInputs={setInputs}/>
        </TabsContent>
        
        <TabsContent value="advanced">
          {/* Before rendering advanced mode, parse the promptTemplate if it contains ### */}
          {(() => {
            // If coming from ExpressMode and promptTemplate contains ###, split it
            if (inputs.promptTemplate && inputs.promptTemplate.includes('###')) {
              const [positive, negative] = inputs.promptTemplate.split('###').map(p => p.trim());
              // Update inputs with split prompts
              setTimeout(() => {
                setInputs(prev => ({
                  ...prev,
                  promptTemplate: positive,
                  negativePrompt: negative || ''
                }));
              }, 0);
            }
            return renderAdvancedMode();
          })()}
        </TabsContent>
      </Tabs>

      {/* Keep all your dialogs at the root level */}
      <Dialog open={isModelPickerOpen} onOpenChange={setIsModelPickerOpen}>
        <DialogContent>
          <AIHordeModelPicker
            isOpen={isModelPickerOpen}
            onClose={() => setIsModelPickerOpen(false)}
            onSelect={handleModelSelect}
            activeModels={activeModels}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isMaskEditorOpen} onOpenChange={setIsMaskEditorOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] h-full p-0">
          <MaskEditor
            image={inputs.sourceImage}
            mask={inputs.sourceMask}
            onSave={(newMask) => {
              setInputs({...inputs, sourceMask: newMask});
              setIsMaskEditorOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCivitAISearchOpen} onOpenChange={setIsCivitAISearchOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Search {searchType === 'LORA' ? 'LoRAs' : 'Textual Inversions'} on CivitAI</DialogTitle>
          </DialogHeader>
          <CivitAISearch 
            modelType={searchType}
            onModelSelect={searchType === 'LORA' ? handleAddLora : handleAddTi}
          />
        </DialogContent>
      </Dialog>

      <CustomSizeDialog
        isOpen={isCustomSizeDialogOpen}
        onClose={() => setIsCustomSizeDialogOpen(false)}
        width={inputs.width}
        height={inputs.height}
        onSizeChange={({ width, height }) => setInputs(prev => ({ ...prev, width, height }))}
        onConfirm={handleCustomSizeConfirm}
      />

      <ModelDetailsDialog
          model={selectedModelDetails}
          isOpen={isModelDetailsOpen}
          onClose={() => {
            setIsModelDetailsOpen(false);
            setSelectedModelDetails(null);
          }}
        />

      <BlueprintCreator
        isOpen={isBlueprintCreatorOpen}
        onClose={() => setIsBlueprintCreatorOpen(false)}
        currentInputs={inputs}
      />
    </div>
  );

};

const getPostProcessing = (inputs) => {
  const postProcessing = [];
  
  // Add face fixer if selected
  if (inputs.faceFixer&&inputs.faceFixer !== 'None') {
    postProcessing.push(inputs.faceFixer);
  }
  
  // Add upscaler if selected
  if (inputs.upscaler && inputs.upscaler !== 'None') {
    postProcessing.push(inputs.upscaler);
  }
  
  // Add strip background if enabled
  if (inputs.stripBackground) {
    postProcessing.push('strip_background');
  }
  return postProcessing;
};

export const generateContent = async (apiKey, selectedModel, generationInputs) => {
  console.log("selectedModel: ",selectedModel);
  const { promptTemplate, negativePrompt } = generationInputs;
  const fullPrompt = negativePrompt ? `${promptTemplate}###${negativePrompt}` : promptTemplate;

  const payload = {
    prompt: fullPrompt,
    params: {
      sampler_name: generationInputs.sampler,
      cfg_scale: generationInputs.cfgScale,
      width: generationInputs.width,
      height: generationInputs.height,
      steps: generationInputs.steps,
      seed: generationInputs.seed || undefined,
      n: 1, //we dont handle batching from aihorde side
      post_processing: getPostProcessing(generationInputs),
      karras: generationInputs.karras,
      tiling: generationInputs.tiling,
      hires_fix: generationInputs.hiresFix,
      hires_fix_denoising_strength: generationInputs.hiresFix ? generationInputs.hiresFixDenoisingStrength : undefined,
      clip_skip: generationInputs.clipSkip,
      denoising_strength: generationInputs.denoisingStrength,
      facefixer_strength: generationInputs.faceFixer !== 'None' ? generationInputs.facefixerStrength : undefined,
      // Add new ControlNet parameters
      control_type: generationInputs.controlType !== 'none' ? generationInputs.controlType : undefined,
      image_is_control: generationInputs.controlType !== 'none' ? generationInputs.imageIsControl : undefined,
      return_control_map: generationInputs.controlType !== 'none' ? generationInputs.returnControlMap : undefined,
      // Add transparent parameter
      transparent: generationInputs.transparent,
    },
    nsfw: generationInputs.nsfw,
    censor_nsfw: !generationInputs.nsfw,
    trusted_workers: generationInputs.trustedWorkers,
    slow_workers: generationInputs.slowWorkers,
    worker_blacklist: generationInputs.workerBlacklist,
    models: [selectedModel],
    r2: false,
    shared: generationInputs.shared,
    replacement_filter: generationInputs.replacementFilter,
    dry_run: false,
  };

  console.log("payload: ",payload);

  // Handle source image for ControlNet or img2img
  if (generationInputs.controlType && generationInputs.controlType !== 'none' && generationInputs.sourceImage) {
    payload.source_image = generationInputs.sourceImage.split(',')[1];
    // Only set source_processing if image isn't being used as control map
    if (!generationInputs.imageIsControl) {
      payload.params.source_processing = 'img2img';
    }
  } else if (generationInputs.sourceProcessing !== 'txt2img') {
    payload.source_image = generationInputs.sourceImage.split(',')[1];
    payload.source_processing = generationInputs.sourceProcessing;
  }

  // Handle workers
  if (generationInputs.workers && generationInputs.workers.length > 0) {
    payload.workers = generationInputs.workers;
    payload.worker_blacklist = generationInputs.workerBlacklist;
  }

  // Handle inpainting mask
  if (generationInputs.sourceProcessing === 'inpainting' && generationInputs.sourceMask) {
    payload.source_mask = generationInputs.sourceMask.split(',')[1];
  }

  // Handle LoRAs
  if (generationInputs.loras && generationInputs.loras.length > 0) {
    payload.params.loras = generationInputs.loras;
  }

  // Handle Textual Inversions
  if (generationInputs.tis && generationInputs.tis.length > 0) {
    payload.params.tis = generationInputs.tis;
  }

  // Make the API request
  const response = await fetch('https://aihorde.net/api/v2/generate/async', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { type: 'image', id: data.id };
};

export const pollContentGeneration = (id, updateCallback) => {
  const poll = async () => {
    try {
      const progress = await checkGenerationProgress(id);
      if (progress.done) {
        const status = await checkGenerationStatus(id);
        if (status.generations && status.generations.length > 0) {
          const generation = status.generations[0];
          const processedResult = {
            type: 'image',
            content: `data:image/png;base64,${generation.img}`,
            metadata: {
              ...generation,
              img: undefined
            }
          };
          updateCallback(id, processedResult, 'completed', JSON.stringify(status, null, 2));
        } else {
          updateCallback(id, null, 'failed', JSON.stringify({
            error: 'No generations returned',
            status
          }, null, 2));
        }
      } else if (progress.faulted) {
        updateCallback(id, null, 'failed', JSON.stringify({
          error: progress.message || 'Generation faulted',
          details: progress
        }, null, 2));
      } else {
        updateCallback(id, null, 'processing', JSON.stringify(progress, null, 2));
        setTimeout(poll, 2000);
      }
    } catch (error) {
      console.error('Error checking AI Horde generation status:', error);
      updateCallback(id, null, 'failed', JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }, null, 2));
    }
  };

  setTimeout(() => {
    updateCallback(id, null, 'processing', 'Initializing generation...');
    poll();
  }, 5000);
};



const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const checkGenerationProgress = async (id) => {
  const response = await fetch(`https://aihorde.net/api/v2/generate/check/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const checkGenerationStatus = async (id) => {
  const response = await fetch(`https://aihorde.net/api/v2/generate/status/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const DEFAULT_GEN_PARAMS = {
  promptTemplate: '',
  negativePrompt: '',
  steps: 30,
  cfgScale: 7.5,
  width: 512,
  height: 512,
  sampler: 'k_euler_a',
  seed: '',
  batchCount: 1,
  denoisingStrength: 0.75,
  karras: true,
  hiresFix: false,
  hiresFixDenoisingStrength: 0.7,
  faceFixer: 'None',
  facefixerStrength: 0.75,
  upscaler: 'None',
  stripBackground: false,
  // no postProcessing in defaults as we'll construct it dynamically
  clipSkip: 1,
  nsfw: false,
  trustedWorkers: false,
  shared: false,
  sourceProcessing: 'txt2img',
  sourceImage: null,
  sourceMask: null,
  loras: [],
  tis: [],
  tiling: false,
  transparent: false,
  imageIsControl: false,
  returnControlMap: false,
  replacementFilter: true,
  slowWorkers: false,
  model: '',
  selectedStyle: null // Add this new field to store selected style
};

// Rest of the file remains unchanged...
