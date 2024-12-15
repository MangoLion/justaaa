# Just Another AI App

A modern React web application built with Vite and ShadCN UI that empowers content creators to seamlessly generate images and 3D models using various free and open-source AI endpoints. Switch effortlessly between services like AI Horde and HuggingFace to create your content.

[https://justaaa.fyrean.com](https://justaaa.fyrean.com)

## Features
- 🎨 Generate images using multiple AI providers
- 🔄 Easy switching between different AI endpoints
- 🖼️ Built-in gallery for managing generated content
- 🎭 Mask editing capabilities
- 🚀 Express mode for quick generations
- 🔍 Integrated CivitAI model search
- 🎲 3D model generation and viewing
- 🖌️ Multiple style presets for image generation

## Application Screenshots
### Model Selection
![Model Selection Interface](images/model_select.png)
Choose from a variety of AI models to achieve your desired results.

### Style Presets
![Style Selection](images/select_style.PNG)
Quick access to different style presets for consistent image generation.

### Text to Image Generation
![Text to Image Interface](images/text_to_image.PNG)
Generate stunning images from text descriptions using multiple AI providers.

### Image to 3D Model Conversion
![Image to 3D Model](images/image_to_3d.PNG)
Transform your 2D images into detailed 3D models.

### 3D Model Viewer
![3D Model Viewer](images/3dmodel_viewer.PNG)
Interactive 3D model viewer for examining generated models from any angle.

## API Tokens

### AI Horde
A default community token is provided with the application that comes loaded with kudos!

### HuggingFace
You'll need to register for a free HuggingFace account and use your token. Free accounts receive approximately 200 H100 GPU seconds per day.

### Fyrean
The 3D model generation [TRELLIS](https://github.com/microsoft/TRELLIS) is hosted by me on my potato PC, no API key needed but will probably get overwhelmed during high demand times.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## Directory Structure

```
├── src/                        # Main React application source code
│   ├── components/             # UI components (its a mess though)
│   │   ├── gallery/            # Gallery-related components
│   │   └── ui/                 # ShadCN UI components
│   ├── hooks/                  # ShadCN hooks
│   └── lib/                    # Utility functions
```

## Key Components

### Frontend Application (`src/`)
- `AIHordeProvider.jsx`, `DeepInfraProvider.jsx`, `HuggingFaceProvider.jsx`: Provider integrations for different AI services
- `ProjectGallery.jsx`: Main gallery interface for viewing and managing AI-generated content
- `CivitAISearch.jsx`: Interface for searching and selecting AI models
- `ImageDetailsModal.jsx`: Detailed view for generated images
- `MaskEditor.jsx`: Image mask editing functionality
- `ExpressMode.jsx`: Streamlined AIhorde interface for quick image generation

### Gallery Components (`src/components/gallery/`)
- `GenerationPanel.jsx`: Controls for AI content generation
- `ImageGrid.jsx`: Display grid for generated content
- `Sidebar.jsx`: Project organization panel

## Key Files for Review

1. **Core Application Logic**
   - `src/App.jsx`: Main application component
   - `src/main.jsx`: Application entry point

2. **Provider Implementations**
   - `src/AIHordeProvider.jsx`
   - `src/DeepInfraProvider.jsx`
   - `src/HuggingFaceProvider.jsx`

3. **Gallery Implementation**
   - `src/ProjectGallery.jsx`
   - `src/components/gallery/ImageGrid.jsx`
   - `src/components/gallery/GenerationPanel.jsx`