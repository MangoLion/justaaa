// DeepInfraProvider.jsx
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_INPUTS = {
  promptTemplate: '',
  numInferenceSteps: 1,
  width: 1024,
  height: 1024,
  seed: '',
  batchCount: 1,
  guidanceScale: 7.5,
};

export const DeepInfraProvider = ({ inputs, setInputs, selectedModel, setSelectedModel }) => {
  return (
    <>
      <div>
        <Label htmlFor="modelSelect">Model</Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="modelSelect">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="black-forest-labs/FLUX-1-schnell">FLUX-1-schnell</SelectItem>
            <SelectItem value="black-forest-labs/FLUX-1-dev">FLUX-1-dev</SelectItem>
            <SelectItem value="black-forest-labs/FLUX-1.1-pro">FLUX-1.1-pro</SelectItem>
            <SelectItem value="stabilityai/sdxl-turbo">SDXL Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="promptTemplate">Prompt Template</Label>
        <Textarea 
          id="promptTemplate" 
          value={inputs.promptTemplate} 
          onChange={(e) => setInputs({...inputs, promptTemplate: e.target.value})}
          className="min-h-[100px] resize-y"
        />
      </div>
      {selectedModel !== 'black-forest-labs/FLUX-1.1-pro' && (
        <div>
          <Label htmlFor="numInferenceSteps">Inference Steps: {inputs.numInferenceSteps}</Label>
          <Slider
            id="numInferenceSteps"
            min={1}
            max={50}
            step={1}
            value={[inputs.numInferenceSteps]}
            onValueChange={(value) => setInputs({...inputs, numInferenceSteps: value[0]})}
          />
        </div>
      )}
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
      <div>
        <Label htmlFor="width">Width</Label>
        <Input 
          id="width" 
          type="number" 
          value={inputs.width} 
          onChange={(e) => setInputs({...inputs, width: Number(e.target.value)})} 
          min={128} 
          max={2048} 
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
          max={2048} 
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
          max={18446744073709551615} 
        />
      </div>
      {selectedModel !== 'black-forest-labs/FLUX-1-schnell' && selectedModel !== 'black-forest-labs/FLUX-1.1-pro' && (
        <div>
          <Label htmlFor="guidanceScale">Guidance Scale: {inputs.guidanceScale}</Label>
          <Slider
            id="guidanceScale"
            min={0}
            max={20}
            step={0.1}
            value={[inputs.guidanceScale]}
            onValueChange={(value) => setInputs({...inputs, guidanceScale: value[0]})}
          />
        </div>
      )}
    </>
  );
};

export const generateContent = async (apiKey, selectedModel, generationInputs) => {
  let body = {
    prompt: generationInputs.prompt,
    width: generationInputs.width,
    height: generationInputs.height,
    seed: generationInputs.seed
  };

  if (selectedModel !== 'black-forest-labs/FLUX-1.1-pro') {
    body.num_inference_steps = generationInputs.numInferenceSteps;
    if (selectedModel !== 'black-forest-labs/FLUX-1-schnell') {
      body.guidance_scale = generationInputs.guidanceScale;
    }
  }

  const response = await fetch(`https://api.deepinfra.com/v1/inference/${selectedModel}`, {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  return { type: 'image', content: data.images[0] };
};

export const DEFAULT_GEN_PARAMS = DEFAULT_INPUTS;