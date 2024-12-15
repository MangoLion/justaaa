import React, { useState, useCallback, useEffect, useMemo  } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Sparkles, Maximize2, ChevronDown, ChevronUp, Loader2, Image as ImageIcon, User, MapPin, Box, Search, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomSizeDialog, { aspectRatios } from './CustomSizeDialog';
import { DEFAULT_GEN_PARAMS } from './AIHordeProvider';

// Import local style data
import styles from './styles/styles.json';
import previews from './styles/previews.json';
import categories from './styles/categories.json';

// Filter out styles that don't exist in styles.json
const validStyles = Object.keys(styles);

// Helper function to check if a category has any valid styles
const categoryHasValidStyles = (categoryStyles) => {
  return categoryStyles.some(style => validStyles.includes(style));
};

// Filter categories to only include those with valid styles and exclude 2023 categories
const validCategories = Object.entries(categories).reduce((acc, [category, categoryStyles]) => {
  if (!category.includes('2023') && !category.includes('2022') && categoryHasValidStyles(categoryStyles)) {
    acc[category] = categoryStyles.filter(style => validStyles.includes(style));
  }
  return acc;
}, {});

// Get all unique valid styles for "all" category
const allStyles = Array.from(new Set(
  Object.values(validCategories).flat()
));

// Add "all" category
const categoriesWithAll = {
  all: allStyles,
  ...validCategories
};

const ExpressMode = ({ inputs, setInputs }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedExample, setSelectedExample] = useState('');
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isCustomSizeDialogOpen, setIsCustomSizeDialogOpen] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('Square (1:1)');
  const [isStylesDialogOpen, setIsStylesDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewType, setPreviewType] = useState('person');

  // Initialize blueprint from inputs if a style is selected
  const [blueprint, setBlueprint] = useState(() => {
    if (inputs.selectedStyle) {
      const styleData = styles[inputs.selectedStyle];
      if (styleData) {
        return {
          name: inputs.selectedStyle,
          promptTemplate: styleData.prompt.replace('{p}', '<<PROMPT>>').replace('{np}', '<<NEGATIVE>>'),
          parameters: styleData,
          preview: previews[inputs.selectedStyle]?.[previewType]
        };
      }
    }
    return null;
  });

  const formatCategoryName = (category) => {
    return category
      .replace('2024', '') // Remove 2024
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim() // Remove any leading/trailing spaces
      .split(' ') // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
      .join(' '); // Join words back together
  };

  const handleStyleSelect = (styleName) => {
    const styleData = styles[styleName];
    if (!styleData) return;
  
    const blueprintData = {
      name: styleName,
      promptTemplate: styleData.prompt.replace('{p}', '<<PROMPT>>').replace('{np}', '<<NEGATIVE>>'),
      parameters: styleData,
      preview: previews[styleName]?.[previewType]
    };
    
    setBlueprint(blueprintData);
    
    // Create new default params excluding prompt fields
    const { promptTemplate, negativePrompt, ...defaultParamsWithoutPrompts } = DEFAULT_GEN_PARAMS;
  
    const processedLoras = styleData.loras?.map(lora => ({
      ...lora,
      model: lora.model ?? 1,
      clip: lora.clip ?? 1,
      is_version: lora.is_version ?? false
    })) || [];
  
    const processedTis = styleData.tis?.map(ti => ({
      ...ti,
      strength: ti.strength ?? 1
    })) || [];
  
    const newInputs = {
      ...defaultParamsWithoutPrompts,
      promptTemplate: inputs.promptTemplate,
      negativePrompt: inputs.negativePrompt,
      steps: styleData.steps ?? defaultParamsWithoutPrompts.steps,
      width: styleData.width ?? defaultParamsWithoutPrompts.width,
      height: styleData.height ?? defaultParamsWithoutPrompts.height,
      cfgScale: styleData.cfg_scale ?? defaultParamsWithoutPrompts.cfgScale,
      clipSkip: styleData.clip_skip ?? defaultParamsWithoutPrompts.clipSkip,
      hiresFix: styleData.hires_fix ?? defaultParamsWithoutPrompts.hiresFix,
      karras: styleData.karras ?? defaultParamsWithoutPrompts.karras,
      sampler: styleData.sampler_name ?? defaultParamsWithoutPrompts.sampler,
      model: styleData.model ?? defaultParamsWithoutPrompts.model,
      loras: processedLoras,
      tis: processedTis,
      selectedStyle: styleName
    };
    
    setInputs(newInputs);
    setIsStylesDialogOpen(false);
  };

  const handleBlueprintUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const blueprintData = JSON.parse(reader.result);
          setBlueprint(blueprintData);
          
          const defaultParams = { ...DEFAULT_GEN_PARAMS };
          const newInputs = {
            ...defaultParams,
            ...blueprintData.parameters,
            width: blueprintData.parameters.width || defaultParams.width,
            height: blueprintData.parameters.height || defaultParams.height,
            seed: defaultParams.seed,
            batchCount: defaultParams.batchCount,
            model: blueprintData.parameters.model || defaultParams.model,
            selectedStyle: null // Clear selected style when uploading blueprint
          };
          
          setInputs(newInputs);
          setUserPrompt('');
          setNegativePrompt('');
          
        } catch (error) {
          console.error('Error parsing blueprint:', error);
        }
      };
      reader.readAsText(file);
    }
  }, [setInputs]);

  const handlePromptChange = useCallback((newPrompt, newNegative) => {
    const updatedPrompt = newPrompt ?? userPrompt;
    const updatedNegative = newNegative ?? negativePrompt;
    
    setUserPrompt(updatedPrompt);
    setNegativePrompt(updatedNegative);
    
    if (blueprint) {
      const fullPrompt = blueprint.promptTemplate
        .replace('<<PROMPT>>', updatedPrompt)
        .replace('<<NEGATIVE>>', updatedNegative);
      setInputs(prev => ({
        ...prev,
        promptTemplate: fullPrompt
      }));
    }
  }, [blueprint, setInputs, userPrompt, negativePrompt]);

  // Add effect to sync with Advanced mode prompts
  // useEffect(() => {
  //   if (inputs.promptTemplate && !inputs.promptTemplate.includes('<<PROMPT>>')) {
  //     // If we have a promptTemplate that's not in Express format, it's from Advanced mode
  //     const [positive, negative] = (inputs.promptTemplate + '###' + (inputs.negativePrompt || '')).split('###').map(p => p.trim());
  //     setUserPrompt(positive);
  //     setNegativePrompt(negative);
  //   }
  // }, [inputs.promptTemplate, inputs.negativePrompt]);

  const handleExampleChange = (value) => {
    setSelectedExample(value);
    setUserPrompt(value);
    handlePromptChange(value, negativePrompt);
  };

  const handleAspectRatioChange = (value) => {
    setSelectedAspectRatio(value);
    const selectedRatio = aspectRatios.find(ratio => ratio.label === value);
    if (selectedRatio.width && selectedRatio.height) {
      setInputs(prev => ({ ...prev, width: selectedRatio.width, height: selectedRatio.height }));
    } else if (value === 'Custom') {
      setIsCustomSizeDialogOpen(true);
    }
  };

  const handleCustomSizeConfirm = () => {
    setIsCustomSizeDialogOpen(false);
    setSelectedAspectRatio('Custom');
  };

  React.useEffect(() => {
    const matchingRatio = aspectRatios.find(
      ratio => ratio.width === inputs.width && ratio.height === inputs.height
    );
    setSelectedAspectRatio(matchingRatio ? matchingRatio.label : 'Custom');
  }, [inputs.width, inputs.height]);

  const StylesDialog = () => {
    const [searchQuery, setSearchQuery] = useState('');
  
    // Filter styles based on search query and selected category
    const filteredStyles = useMemo(() => {
      const categoryStyles = categoriesWithAll[selectedCategory] || [];
      if (!searchQuery) return categoryStyles;
  
      return categoryStyles.filter(styleName =>
        styleName.toLowerCase().replace(/_/g, ' ').includes(searchQuery.toLowerCase())
      );
    }, [selectedCategory, searchQuery]);
  
    return (
      <Dialog open={isStylesDialogOpen} onOpenChange={setIsStylesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select a Style</DialogTitle>
          </DialogHeader>
          
          <div className="relative h-full">
            {/* Floating Controls Row */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
              <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                {/* Search Input */}
                <div className="relative flex-grow min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search styles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {/* Category Selector */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categoriesWithAll).map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategoryName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
  
                {/* Preview Type Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={previewType === 'person' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewType('person')}
                    className="gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Person</span>
                  </Button>
                  <Button
                    variant={previewType === 'place' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewType('place')}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="hidden md:inline">Place</span>
                  </Button>
                  <Button
                    variant={previewType === 'thing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewType('thing')}
                    className="gap-2"
                  >
                    <Box className="h-4 w-4" />
                    <span className="hidden md:inline">Thing</span>
                  </Button>
                </div>
              </div>
            </div>
  
            {/* Scrollable Content Area */}
            <div className="overflow-y-auto max-h-[calc(80vh-12rem)] pt-4">
              {/* Styles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStyles.map((styleName) => {
                  const preview = previews[styleName]?.[previewType];
                  return (
                    <Button
                      key={styleName}
                      variant="outline"
                      className="h-48 relative overflow-hidden group transition-all hover:border-primary"
                      onClick={() => handleStyleSelect(styleName)}
                    >
                      {preview ? (
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ 
                            backgroundImage: `url(${preview})`,
                            filter: 'brightness(0.7)'
                          }} 
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                      )}
                      <div className="relative z-10 flex flex-col items-center justify-center space-y-2 p-4">
                        {!preview && (
                          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center mb-2">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <h3 className="text-lg font-semibold text-white bg-black/50 px-3 py-1 rounded-lg shadow-lg text-center">
                          {styleName.replace(/_/g, ' ')}
                        </h3>
                      </div>
                    </Button>
                  );
                })}
              </div>
  
              {/* No Results Message */}
              {filteredStyles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No styles found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const SelectBlueprintButton = () => (
    <Button 
      variant="outline" 
      className="w-full h-48 relative overflow-hidden group transition-all hover:border-primary"
      onClick={() => setIsStylesDialogOpen(true)}
    >
      {blueprint?.preview ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${blueprint.preview})`,
            filter: 'brightness(0.7)'
          }} 
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 group-hover:opacity-75 transition-opacity" />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white bg-black/50 px-3 py-1 rounded-lg shadow-lg">
            {blueprint ? blueprint.name : 'Select Style'}
          </h3>
          {!blueprint && (
            <p className="text-sm text-white/80">Choose a pre-configured style for your image generation</p>
          )}
        </div>
      </div>
    </Button>
  );

  const handleReset = () => {
    setBlueprint(null);
    setUserPrompt('');
    setNegativePrompt('');
    setInputs({
      ...DEFAULT_GEN_PARAMS,
      selectedStyle: null
    });
  };

  if (!blueprint) {
    return (
      <div className="py-6">
        <SelectBlueprintButton />

        {/* Keep the original file upload as a fallback */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Or upload your own blueprint</p>
          <Input
            id="blueprint-upload"
            type="file"
            accept=".json"
            onChange={handleBlueprintUpload}
          />
        </div>

        <StylesDialog />
      </div>
    );
  }

  const finalPrompt = blueprint.promptTemplate
    .replace('<<PROMPT>>', userPrompt)
    .replace('<<NEGATIVE>>', negativePrompt);
  const userPromptStart = finalPrompt.indexOf(userPrompt);
  const userPromptEnd = userPromptStart + userPrompt.length;
  const negativePromptStart = finalPrompt.indexOf(negativePrompt);
  const negativePromptEnd = negativePromptStart + negativePrompt.length;

  return (
    <div className="space-y-6">
      <div className="py-6">
        <SelectBlueprintButton />
        <Input
          id="blueprint-upload"
          type="file"
          accept=".json"
          onChange={handleBlueprintUpload}
          className="hidden"
        />
      </div>

      <StylesDialog />

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Your Prompt</Label>
            {blueprint.examplePrompts && blueprint.examplePrompts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    Examples
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {blueprint.examplePrompts.map((prompt, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => handleExampleChange(prompt)}
                    >
                      {prompt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <Textarea
            value={userPrompt}
            onChange={(e) => handlePromptChange(e.target.value, null)}
            placeholder="Describe what you want to generate..."
            className="h-20"
          />
        </div>

        <div>
          <Label>Negative Prompt</Label>
          <Textarea
            value={negativePrompt}
            onChange={(e) => handlePromptChange(null, e.target.value)}
            placeholder="Describe what you want to avoid..."
            className="min-h-[2.5rem]"
            rows={1}
          />
        </div>

        <Collapsible open={isPromptOpen} onOpenChange={setIsPromptOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex justify-between">
              Final Prompt
              {isPromptOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Alert className="mt-2">
              <AlertDescription className="font-mono text-sm whitespace-pre-wrap">
                {finalPrompt.slice(0, userPromptStart)}
                <span className="font-semibold text-blue-800 dark:text-yellow-400">
                {' '}{userPrompt}{' '}
                </span>
                {finalPrompt.slice(userPromptEnd, negativePromptStart)}
                <span className="font-semibold text-red-800 dark:text-red-400">
                {' '}{negativePrompt}{' '}
                </span>
                {finalPrompt.slice(negativePromptEnd)}
              </AlertDescription>
            </Alert>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex gap-2">
          <div className="flex-grow">
            <Label>Image Size</Label>
            <Select 
              value={selectedAspectRatio}
              onValueChange={handleAspectRatioChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
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
          <Label>Seed (optional)</Label>
          <Input
            type="text"
            value={inputs.seed}
            onChange={(e) => setInputs(prev => ({ ...prev, seed: e.target.value }))}
            placeholder="Leave empty for random seed"
          />
        </div>

        <div>
          <Label>Batch Count: {inputs.batchCount}</Label>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[inputs.batchCount]}
            onValueChange={([value]) => setInputs(prev => ({ ...prev, batchCount: value }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="nsfw"
            checked={inputs.nsfw}
            onCheckedChange={(checked) => setInputs(prev => ({ ...prev, nsfw: checked }))}
          />
          <Label htmlFor="nsfw">Allow NSFW Content</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="slowWorkers"
            checked={inputs.slowWorkers}
            onCheckedChange={(checked) => setInputs(prev => ({ ...prev, slowWorkers: checked }))}
          />
          <Label htmlFor="slowWorkers">Allow Slow Workers</Label>
        </div>

        <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Selection
        </Button>
      </div>
      </div>

      <CustomSizeDialog
        isOpen={isCustomSizeDialogOpen}
        onClose={() => setIsCustomSizeDialogOpen(false)}
        width={inputs.width}
        height={inputs.height}
        onSizeChange={({ width, height }) => setInputs(prev => ({ ...prev, width, height }))}
        onConfirm={handleCustomSizeConfirm}
      />
    </div>
  );
};

export default ExpressMode;
