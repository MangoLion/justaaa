import { ChevronLeft, ChevronRight, Play, List, HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { Slider } from '../../components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useToast } from "../../hooks/use-toast";
import ThemeToggle from './ThemeToggle';
import GenerationControls from './GenerationControls';
import { useState } from 'react';
import { DEFAULT_GEN_PARAMS } from '@/AIHordeProvider';

const GenerationPanel = ({
  isOpen,
  onToggle,
  generateContent,
  openApiKeyDialog,
  generationInputs,
  selectedProvider,
  onProviderChange,
  selectedModel,
  setSelectedModel,
  setGenerationInputs,
  AIHordeProvider,
  DeepInfraProvider,
  HuggingFaceProvider,
  FyreanProvider,
  selectedTask,
  onTaskChange
}) => {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const { toast } = useToast();

  const tasks = [
    'Text to Image',
    'Image to 3D',
    'Text to 3D (Coming Soon!)',
    '3D Texturing (Coming Soon!)',
    '3D Model Editing (Coming Soon!)'
  ];

  const taskProviders = {
    'Text to Image': [
      { value: 'aihorde', label: 'AI Horde' },
      { value: 'huggingface', label: 'Hugging Face' }
      //Only temp disable deepinfra, please do not remove!
      //{ value: 'deepinfra', label: 'DeepInfra' }*
    ],
    'Image to 3D': [
      { value: 'fyrean', label: 'Fyrean' }
    ],
    'Text to 3D (Coming Soon!)': [],
    '3D Texturing (Coming Soon!)': [],
    '3D Model Editing (Coming Soon!)': []
  };

  const currentProviders = taskProviders[selectedTask] || [];

  // Reset provider if not available for new task type
  const handleTaskChange = (newTask) => {
    onTaskChange(newTask);
    setTaskDialogOpen(false);
    const newProviders = taskProviders[newTask] || [];
    if (!newProviders.find(p => p.value === selectedProvider)) {
      // If current provider not available in new task, select first available
      onProviderChange(newProviders[0]?.value || '');
    }
  };

  const handleResetParameters = () => {
    switch (selectedProvider) {
      case 'aihorde':
        console.log(DEFAULT_GEN_PARAMS)
        setGenerationInputs(DEFAULT_GEN_PARAMS);
        setSelectedModel('');
        toast({
          title: "Parameters Reset",
          description: "AI Horde parameters have been reset to default values.",
        });
        break;

      case 'deepinfra':
        setGenerationInputs({
          promptTemplate: '',
          numInferenceSteps: 1,
          width: 1024,
          height: 1024,
          seed: '',
          batchCount: 1,
          guidanceScale: 7.5
        });
        setSelectedModel('black-forest-labs/FLUX-1-schnell');
        toast({
          title: "Parameters Reset",
          description: "DeepInfra parameters have been reset to default values.",
        });
        break;

      case 'huggingface':
        setGenerationInputs({
          promptTemplate: '',
          guidanceScale: 7.5,
          numInferenceSteps: 50,
          width: 512,
          height: 512,
          seed: '',
          batchCount: 1,
          negativePrompt: ''
        });
        setSelectedModel('');
        toast({
          title: "Parameters Reset",
          description: "HuggingFace parameters have been reset to default values.",
        });
        break;

      case 'fyrean':
        setGenerationInputs({
          seed: '',
          ss_guidance_strength: 7.5,
          ss_sampling_steps: 12,
          slat_guidance_strength: 3.0,
          slat_sampling_steps: 12,
          mesh_simplify: 0.95,
          texture_size: 1024,
          apiUrl: 'https://trellis.fyrean.com'
        });
        toast({
          title: "Parameters Reset",
          description: "Fyrean parameters have been reset to default values.",
        });
        break;

      default:
        toast({
          title: "Error",
          description: "No provider selected.",
          variant: "destructive",
        });
        break;
    }
  };

  const renderProviderControls = () => {
    switch (selectedProvider) {
      case 'fyrean':
        return (
          <TooltipProvider>
            <div className="space-y-4">
              {FyreanProvider.generationInputs.map(input => {
                const labelWithTooltip = input.description ? (
                  <div className="flex items-center gap-2">
                    <span>{input.label}: {generationInputs[input.id] || input.defaultValue}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{input.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <span>{input.label}: {generationInputs[input.id] || input.defaultValue}</span>
                );

                switch (input.type) {
                  case 'slider':
                    return (
                      <div key={input.id} className="space-y-2">
                        <Label>{labelWithTooltip}</Label>
                        <Slider
                          value={[generationInputs[input.id] || input.defaultValue]}
                          onValueChange={([value]) => {
                            setGenerationInputs({
                              ...generationInputs,
                              [input.id]: value
                            });
                          }}
                          min={input.min}
                          max={input.max}
                          step={input.step}
                          disabled={input.disabled?.(generationInputs)}
                        />
                      </div>
                    );
                  case 'switch':
                    return (
                      <div key={input.id} className="flex items-center justify-between">
                        <Label>{labelWithTooltip}</Label>
                        <Switch
                          checked={generationInputs[input.id] || input.defaultValue}
                          onCheckedChange={(checked) => {
                            setGenerationInputs({
                              ...generationInputs,
                              [input.id]: checked
                            });
                          }}
                        />
                      </div>
                    );
                  case 'select':
                    return (
                      <div key={input.id} className="space-y-2">
                        <Label>{labelWithTooltip}</Label>
                        <Select
                          value={generationInputs[input.id]?.toString() || input.defaultValue.toString()}
                          onValueChange={(value) => {
                            setGenerationInputs({
                              ...generationInputs,
                              [input.id]: parseInt(value)
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {input.options.map(option => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  case 'text':
                    return (
                      <div key={input.id} className="space-y-2">
                        <Label>{labelWithTooltip}</Label>
                        <input
                          type="text"
                          value={generationInputs[input.id] || input.defaultValue}
                          onChange={(e) => {
                            setGenerationInputs({
                              ...generationInputs,
                              [input.id]: e.target.value
                            });
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </TooltipProvider>
        );
      case 'aihorde':
        return (
          <AIHordeProvider
            inputs={generationInputs}
            setInputs={setGenerationInputs}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        );
      case 'deepinfra':
        return (
          <DeepInfraProvider
            inputs={generationInputs}
            setInputs={setGenerationInputs}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        );
      case 'huggingface':
        return (
          <HuggingFaceProvider
            inputs={generationInputs}
            setInputs={setGenerationInputs}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        );
      default:
        return null;
    }
  };

  // Check if we're in Express Mode
  const isExpressMode = selectedProvider === 'aihorde' && generationInputs.selectedStyle;

  return (
    <div className={`bg-gray-200 dark:bg-gray-900 transition-all duration-300 flex flex-col
      ${isOpen ? 'landscape:w-1/2 h-screen' : 'landscape:w-1/4 landscape:h-screen portrait:h-10'}
      ${isOpen ? 'portrait:w-full' : 'portrait:w-12'}
      ${isOpen ? 'flex flex-col' : 'portrait:flex portrait:flex-row landscape:flex landscape:flex-col'}
    `}>
      <Button
        onClick={onToggle}
        className={`rounded-none bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shrink-0
          ${isOpen ? 'w-full h-10' : 'portrait:w-12 portrait:h-10 landscape:w-full landscape:h-10'}
        `}
      >
        {isOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
      </Button>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className={`rounded-none bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white mb-1 shrink-0
              ${isOpen ? 'w-full h-10' : 'portrait:h-10 portrait:w-12 landscape:w-full landscape:h-10'}
              ${!isOpen && 'portrait:hidden'}
            `}
          >
           <List className="mr-2 h-4 w-4" /> {selectedTask.toUpperCase()}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Task Type</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            {tasks.map((task) => (
              <Button
                key={task}
                onClick={() => handleTaskChange(task)}
                disabled={task.includes('Coming Soon')}
                className={`h-12 text-white font-semibold ${
                  task === selectedTask
                    ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                }`}
              >
                {task.toUpperCase()}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className={`flex flex-col h-full overflow-hidden ${!isOpen && 'portrait:hidden'}`}>
        <div className="shrink-0">
          <GenerationControls
            generateContent={generateContent}
            openApiKeyDialog={openApiKeyDialog}
            generationInputs={generationInputs}
            selectedProvider={selectedProvider}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <Label htmlFor="providerSelect">Provider</Label>
              <Select value={selectedProvider} onValueChange={onProviderChange}>
                <SelectTrigger id="providerSelect">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {currentProviders.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderProviderControls()}
          </div>
          {!isExpressMode && (
            <Button 
              onClick={handleResetParameters}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Parameters
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default GenerationPanel;
