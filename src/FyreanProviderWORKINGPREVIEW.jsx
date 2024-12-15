export const DEFAULT_GEN_PARAMS = {
  seed: 0,
  randomize_seed: true,
  ss_guidance_strength: 7.5,
  ss_sampling_steps: 12,
  slat_guidance_strength: 3.0,
  slat_sampling_steps: 12,
  mesh_simplify: 0.95,
  texture_size: 1024,
  apiUrl: 'https://trellis.fyrean.com'
};

export const generateContent = async (apiKey, model, params) => {
  const formData = new FormData();
  formData.append('file', params.file);

  const queryParams = new URLSearchParams({
    session_id: crypto.randomUUID(),
    seed: params.seed,
    randomize_seed: params.randomize_seed,
    ss_guidance_strength: params.ss_guidance_strength,
    ss_sampling_steps: params.ss_sampling_steps,
    slat_guidance_strength: params.slat_guidance_strength,
    slat_sampling_steps: params.slat_sampling_steps,
    mesh_simplify: params.mesh_simplify,
    texture_size: params.texture_size
  });

  const response = await fetch(`${params.apiUrl}/process-image?${queryParams}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to process image');
  }

  const data = await response.json();
  
  // Convert hex strings to binary data
  const previewBlob = hexToBlob(data.preview_video_base64, 'video/mp4');
  const modelData = hexToUint8Array(data.glb_model_base64);

  return {
    type: '3d',
    content: {
      preview: previewBlob, // Return the blob directly instead of a URL
      modelData
    },
    metadata: {
      trial_id: data.trial_id,
      queue_info: data.queue_info
    }
  };
};

const hexToBlob = (hexString, type) => {
  const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return new Blob([bytes], { type });
};

const hexToUint8Array = (hexString) => {
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
};

export const FyreanProvider = {
  name: 'fyrean',
  displayName: 'Fyrean',
  description: 'Generate 3D models from images',
  requiresApiKey: false,
  supportsInpainting: false,
  supportsOutpainting: false,
  supportedSizes: [
    { width: 512, height: 512 },
    { width: 1024, height: 1024 },
    { width: 2048, height: 2048 }
  ],
  generationInputs: [
    {
      id: 'seed',
      type: 'number',
      label: 'Seed',
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      defaultValue: DEFAULT_GEN_PARAMS.seed,
      disabled: (inputs) => inputs.randomize_seed
    },
    {
      id: 'randomize_seed',
      type: 'switch',
      label: 'Randomize Seed',
      defaultValue: DEFAULT_GEN_PARAMS.randomize_seed
    },
    {
      id: 'ss_guidance_strength',
      type: 'slider',
      label: 'SS Guidance Strength',
      min: 1,
      max: 10,
      step: 0.1,
      defaultValue: DEFAULT_GEN_PARAMS.ss_guidance_strength
    },
    {
      id: 'ss_sampling_steps',
      type: 'slider',
      label: 'SS Sampling Steps',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: DEFAULT_GEN_PARAMS.ss_sampling_steps
    },
    {
      id: 'slat_guidance_strength',
      type: 'slider',
      label: 'SLAT Guidance Strength',
      min: 1,
      max: 10,
      step: 0.1,
      defaultValue: DEFAULT_GEN_PARAMS.slat_guidance_strength
    },
    {
      id: 'slat_sampling_steps',
      type: 'slider',
      label: 'SLAT Sampling Steps',
      min: 1,
      max: 20,
      step: 1,
      defaultValue: DEFAULT_GEN_PARAMS.slat_sampling_steps
    },
    {
      id: 'mesh_simplify',
      type: 'slider',
      label: 'Mesh Simplification',
      min: 0,
      max: 0.99,
      step: 0.01,
      defaultValue: DEFAULT_GEN_PARAMS.mesh_simplify
    },
    {
      id: 'texture_size',
      type: 'select',
      label: 'Texture Size',
      options: [
        { value: 512, label: '512x512' },
        { value: 1024, label: '1024x1024' },
        { value: 2048, label: '2048x2048' }
      ],
      defaultValue: DEFAULT_GEN_PARAMS.texture_size
    },
    {
      id: 'apiUrl',
      type: 'text',
      label: 'API URL',
      defaultValue: DEFAULT_GEN_PARAMS.apiUrl
    }
  ]
};
