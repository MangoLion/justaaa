import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider } from 'next-themes';

import ImageDetailsModal from './ImageDetailsModal';
import ModelDetailsModal from './ModelDetailsModal';
import Sidebar from './components/gallery/Sidebar';
import GenerationPanel from './components/gallery/GenerationPanel';
import ImageGrid from './components/gallery/ImageGrid';
import ImageGridControls from './components/gallery/ImageGridControls';
import GenerationErrorDialog from './components/gallery/GenerationErrorDialog';
import ApiKeyDialog from './components/gallery/ApiKeyDialog';
import FloatingUploadButton from './components/gallery/FloatingUploadButton';
import { AIHordeProvider, generateContent as generateAIHordeContent, pollContentGeneration, DEFAULT_GEN_PARAMS as AIHORDE_DEFAULT_PARAMS } from './AIHordeProvider';
import { DeepInfraProvider, generateContent as generateDeepInfraContent, DEFAULT_GEN_PARAMS as DEEPINFRA_DEFAULT_PARAMS } from './DeepInfraProvider';
import { HuggingFaceProvider, generateContent as generateHuggingFaceContent, DEFAULT_GEN_PARAMS as HUGGINGFACE_DEFAULT_PARAMS } from './HuggingFaceProvider';
import { FyreanProvider, generateContent as generateFyreanContent, DEFAULT_GEN_PARAMS as FYREAN_DEFAULT_PARAMS, checkHealth } from './FyreanProvider';
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import {
  saveToIndexedDB,
  getFromIndexedDB,
  createThumbnail,
  extractMetadata,
  downloadProjectAsZip,
  downloadSelectedImagesAsZip,
  generatePrompts,
  generateRandomSeed,
  extractWaitTime
} from './components/gallery/utils';

const ALL_PROJECTS_ID = 'all';

const ProjectGallery = () => {
  // State management
  const [projectPanelOpen, setProjectPanelOpen] = useState(false);
  const [generationPanelOpen, setGenerationPanelOpen] = useState(true);
  const [projects, setProjects] = useState([{ id: 1, name: 'Default', images: [] }]);
  const [selectedProject, setSelectedProject] = useState(1);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selected3DModel, setSelected3DModel] = useState(null); // Renamed from selectedModel/setSelectedModel
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [selectedImages, setSelectedImages] = useState({});
  const [starredImages, setStarredImages] = useState({});
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [generationInputs, setGenerationInputs] = useState(AIHORDE_DEFAULT_PARAMS);
  const [selectedModelName, setSelectedModelName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('aihorde');
  const [selectedTask, setSelectedTask] = useState('Text to Image');
  const [apiKeys, setApiKeys] = useState({
    aihorde: '3ea60a2b' + '-' + '1ea4' + '-' +'4097'+'-'+'8405' + '-' + 'b5fd174a9383'
  });
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const { toast } = useToast();

  const uploadImageRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get current images based on selected project
  const currentImages = selectedProject === ALL_PROJECTS_ID
    ? projects.flatMap(project => project.images)
    : projects.find(p => p.id === selectedProject)?.images || [];

  // Load workspace on mount
  useEffect(() => {
    const loadWorkspace = async () => {
      const savedWorkspace = await getFromIndexedDB('currentWorkspace');
      if (savedWorkspace) {
        // Create new blob URLs for 3D content after loading
        const processedProjects = savedWorkspace.projects.map(project => ({
          ...project,
          images: project.images.map(item => {
            if (item.type === '3d') {
          // Don't create URLs here, let the components handle it
              return {
                ...item,
                url: null
              };
            }
            return item;
          })
        }));

        setProjects(processedProjects);
        setSelectedProject(savedWorkspace.selectedProject);
        setGenerationInputs(savedWorkspace.generationInputs);
        setSelected3DModel(savedWorkspace.selected3DModel); // Updated name
        setStarredImages(savedWorkspace.starredImages);
        if (savedWorkspace.selectedProvider) {
          setSelectedProvider(savedWorkspace.selectedProvider);
        }
        if (savedWorkspace.selectedTask) {
          setSelectedTask(savedWorkspace.selectedTask);
        }
      }
      setWorkspaceLoaded(true);
    };

    loadWorkspace();
  }, []);

  // Save workspace on changes
    // Debounced workspace save
    const saveWorkspaceDebounced = useCallback(
      (() => {
        let timeoutId = null;
        return () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(async () => {
            if (workspaceLoaded) {
              const cleanProjects = projects.map(project => ({
                ...project,
                images: project.images.map(item => {
                  if (item.type === '3d') {
                    return {
                      ...item,
                      url: null
                    };
                  }
                  return item;
                })
              }));
  
              await saveToIndexedDB('currentWorkspace', {
                projects: cleanProjects,
                selectedProject,
                generationInputs,
                selected3DModel,
                starredImages,
                selectedProvider,
                selectedTask,
              });
            }
          }, 2000); // 1 second debounce delay
        };
      })(),
      [projects, selectedProject, generationInputs, starredImages, selectedProvider, selectedTask, workspaceLoaded]
    );
  
    // Save workspace on changes
    useEffect(() => {
      saveWorkspaceDebounced();
      // Cleanup function to clear any pending timeouts
      return () => saveWorkspaceDebounced.cancel?.();
    }, [projects, selectedProject, generationInputs, starredImages, selectedProvider, selectedTask, workspaceLoaded]);

  // Load API keys and set current key
  useEffect(() => {
              const loadApiKeys = async () => {
      const savedApiKeys = await getFromIndexedDB('apiKeys');
      if (savedApiKeys) {
        setApiKeys(savedApiKeys);
      }
    };

    loadApiKeys();
  }, []);

  useEffect(() => {
    if (selectedProvider && apiKeys[selectedProvider]) {
      setCurrentApiKey(apiKeys[selectedProvider]);
    } else {
      setCurrentApiKey('');
    }
  }, [selectedProvider, apiKeys]);

const handleProviderChange = (newProvider) => {
  setSelectedProvider(newProvider);
  if (newProvider === 'aihorde') {
    setGenerationInputs(AIHORDE_DEFAULT_PARAMS);
    setSelectedModelName(''); // Updated from setSelectedModel
  } else if (newProvider === 'deepinfra') {
    setGenerationInputs(DEEPINFRA_DEFAULT_PARAMS);
    setSelectedModelName('black-forest-labs/FLUX-1-schnell'); // Updated from setSelectedModel
  } else if (newProvider === 'huggingface') {
    setGenerationInputs(HUGGINGFACE_DEFAULT_PARAMS);
  } else if (newProvider === 'fyrean') {
    setGenerationInputs(FYREAN_DEFAULT_PARAMS);
  }
};

  const processAIHordeQueue = async (contentItems) => {
    for (const item of contentItems) {
      try {
        const result = await generateAIHordeContent(apiKeys[selectedProvider], selectedModelName, item.generationInputs);
        pollContentGeneration(result.id, (id, generations, status, metadata) => 
          updateContentStatus(item.id, generations, status, metadata)
);
            } catch (error) {
        console.error('Error generating AI Horde content:', error);
        updateContentStatus(item.id, null, 'failed');
      }
    }
  };
          
          const updateContentStatus = async (id, result, status, metadata) => {
    if (status === 'completed' && result) {
      let updatedContent;
      if (result.type === 'image') {
        updatedContent = {
          url: result.content,
          status: 'completed',
          metadata: JSON.stringify(result.metadata || {}, null, 2),
          type: 'image'
        };
      } else if (result.type === '3d') {
        try {
          // Handle the case where preview is already a blob
          const previewData = result.content.preview instanceof Blob 
            ? result.content.preview 
            : await (await fetch(result.content.preview)).blob();
          
          updatedContent = {
            previewData,
            modelData: result.content.modelData,
            status: 'completed',
            metadata: JSON.stringify(result.metadata || {}, null, 2),
            type: '3d'
          };
        } catch (error) {
          console.error('Error handling preview video:', error);
          updatedContent = {
            modelData: result.content.modelData,
            status: 'completed',
            metadata: JSON.stringify(result.metadata || {}, null, 2),
            type: '3d'
          };
        }
      }
  
      if (updatedContent) {
        setProjects(projects => projects.map(project =>
          project.id === selectedProject
            ? {
                ...project,
                images: project.images.map(item =>
                  item.id === id ? { ...item, ...updatedContent } : item
                )
              }
            : project
        ));
      }
    } else if (status === 'processing' || status === 'failed') {
      const waitTime = extractWaitTime(metadata);
      const statusMessage = typeof metadata === 'string' && !metadata.trim().startsWith('{') 
        ? metadata 
        : null;

      setProjects(projects => projects.map(project =>
        project.id === selectedProject
          ? {
              ...project,
              images: project.images.map(item =>
                item.id === id ? { 
            ...item,
            status, 
                  metadata,
                  waitTime,
                  statusMessage
                } : item
              )
            }
          : project
      ));
    }
  };

  const handleGenerateContent = async (file = null) => {
    if (selectedProject === ALL_PROJECTS_ID) {
      toast({
        title: "Error",
        description: "Please select a specific project before generating content.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKeys[selectedProvider] && selectedProvider !== 'fyrean') {
      setApiKeyDialogOpen(true);
      return;
    }

    // Check if in portrait mode and collapse generation panel
    if (window.matchMedia('(orientation: portrait)').matches) {
      setGenerationPanelOpen(false);
    }

    let newContent = [];

    if (selectedProvider === 'fyrean') {
      if (!file) {
        toast({
          title: "Error",
          description: "Please select an image file to generate a 3D model.",
          variant: "destructive",
        });
        return;
      }

      newContent = [{
        id: Date.now() + Math.random(),
        url: URL.createObjectURL(file),
        generationInputs: {
          ...generationInputs,
          file,
          provider: selectedProvider
        },
        provider: selectedProvider,
        status: 'generating',
        type: '3d'
      }];
    } else {
      // For other providers, we need a prompt
      if (!generationInputs.promptTemplate?.trim()) {
        toast({
          title: "Error",
          description: "Please enter a prompt to generate images.",
          variant: "destructive",
        });
        return;
      }

      const generatedPrompts = generatePrompts(generationInputs.promptTemplate);
      for (let i = 0; i < generationInputs.batchCount; i++) {
        for (const prompt of generatedPrompts) {
          const contentInputs = { 
            ...generationInputs, 
            prompt, 
            seed: generationInputs.seed || generateRandomSeed(),
            provider: selectedProvider
          };
          newContent.push({
            id: Date.now() + Math.random(),
            url: `/api/placeholder/${contentInputs.width}/${contentInputs.height}`,
            generationInputs: contentInputs,
            provider: selectedProvider,
            status: 'generating',
            type: 'image'
          });
        }
      }
    }

    setProjects(projects.map(project => 
      project.id === selectedProject 
        ? { ...project, images: [...project.images, ...newContent] } 
        : project
    ));
    console.log(selectedProvider)
    try {
      if (selectedProvider === 'deepinfra') {
        for (const item of newContent) {
          const result = await generateDeepInfraContent(apiKeys[selectedProvider], selectedModelName, item.generationInputs);
          const thumbnail = await createThumbnail(result.content);
          updateContentStatus(item.id, result, 'completed', JSON.stringify(result, null, 2), thumbnail);
        }
      } else if (selectedProvider === 'aihorde') {
        await processAIHordeQueue(newContent);
      } else if (selectedProvider === 'huggingface') {
        for (const item of newContent) {
          const result = await generateHuggingFaceContent(apiKeys[selectedProvider], selectedModelName, item.generationInputs);
          const thumbnail = await createThumbnail(`data:image/png;base64,${result.content}`);
          updateContentStatus(item.id, result, 'completed', JSON.stringify(result, null, 2), thumbnail);
        }
      } else if (selectedProvider === 'fyrean') {
        const healthData = await checkHealth(generationInputs.apiUrl);
        const { queue_stats } = healthData;
        // Show estimated time toast
        toast({
          title: "Generation Started",
          description: `Estimated processing time: ${queue_stats.average_processing_time*(queue_stats.requests_in_queue+1)} seconds`,
        });

        for (const item of newContent) {
          
          const result = await generateFyreanContent(null, null, item.generationInputs);
          updateContentStatus(item.id, result, 'completed', JSON.stringify(result.metadata, null, 2));
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      newContent.forEach(item => updateContentStatus(item.id, null, 'failed', error.message));
      toast({
        title: "Error",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    }
  };

   // Project management handlers
   const handleAddProject = () => {
    if (newProjectName.trim()) {
      setProjects([...projects, { id: Date.now(), name: newProjectName.trim(), images: [] }]);
      setNewProjectName('');
    }
  };

  const handleRemoveProject = (id) => {
    setProjects(projects.filter(project => project.id !== id));
    if (selectedProject === id) {
      setSelectedProject(projects[0]?.id);
    }
  };

  const handleRenameProject = (id, newName) => {
    setProjects(projects.map(project => 
      project.id === id ? { ...project, name: newName } : project
    ));
  };

  // Image management handlers
  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => ({...prev, [imageId]: !prev[imageId]}));
  };

  const handleImageStar = (imageId) => {
    setStarredImages(prev => ({...prev, [imageId]: !prev[imageId]}));
  };

  const handleImageRemove = (imageId) => {
    if (selectedProject === ALL_PROJECTS_ID) {
      // When "All Projects" is selected, remove the image from whichever project contains it
      setProjects(projects.map(project => ({
        ...project,
        images: project.images.filter(image => image.id !== imageId)
      })));
    } else {
      // When a specific project is selected, remove only from that project
      setProjects(projects.map(project =>
        project.id === selectedProject
          ? { ...project, images: project.images.filter(image => image.id !== imageId) }
          : project
      ));
    }
    // Clear the image from selected images if it was selected
    setSelectedImages(prev => {
      const newSelected = { ...prev };
      delete newSelected[imageId];
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allSelected = {};
    currentProject?.images.forEach(image => {
      allSelected[image.id] = true;
    });
    setSelectedImages(allSelected);
  };

  const handleUnselectAll = () => {
    setSelectedImages({});
  };

  const handleSelectStarred = () => {
    const starredSelection = {};
    currentProject?.images.forEach(image => {
      if (starredImages[image.id]) {
        starredSelection[image.id] = true;
      }
    });
    setSelectedImages(starredSelection);
  };

  const handleInvertSelection = () => {
    const invertedSelection = {};
    currentProject?.images.forEach(image => {
      invertedSelection[image.id] = !selectedImages[image.id];
    });
    setSelectedImages(invertedSelection);
  };

  const handleRemoveSelected = () => {
    setProjects(projects.map(project =>
      project.id === selectedProject
        ? { ...project, images: project.images.filter(image => !selectedImages[image.id]) }
        : project
    ));
    setSelectedImages({});
  };

  const handleWorkspaceDownload = async () => {
    // Convert projects to a serializable format
    const serializableProjects = await Promise.all(projects.map(async project => ({
      ...project,
      images: await Promise.all(project.images.map(async item => {
        if (item.type === '3d') {
          // Convert Blob data to base64 strings
          const modelDataBase64 = item.modelData ? 
            await new Promise(resolve => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(new Blob([item.modelData]));
            }) : null;
          
          const previewDataBase64 = item.previewData ?
            await new Promise(resolve => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(item.previewData);
            }) : null;

          return {
            ...item,
            modelData: modelDataBase64,
            previewData: previewDataBase64,
            url: null // Clear any blob URLs
          };
        }
        return item;
      }))
    })));

    const workspaceData = JSON.stringify({
      projects: serializableProjects,
      selectedProject,
      generationInputs,
      selected3DModel, // Updated from selectedModel
      starredImages,
      selectedProvider,
      selectedTask,
    });
    
    const blob = new Blob([workspaceData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWorkspaceUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workspaceData = JSON.parse(e.target.result);
          
          // Convert projects back from serialized format
          const restoredProjects = workspaceData.projects.map(project => ({
            ...project,
            images: project.images.map(item => {
              if (item.type === '3d') {
                // Convert base64 strings back to Blobs
                const modelData = item.modelData ? 
                  new Uint8Array(atob(item.modelData).split('').map(c => c.charCodeAt(0))).buffer :
                  null;
                
                const previewData = item.previewData ?
                  new Blob([Uint8Array.from(atob(item.previewData), c => c.charCodeAt(0))], { type: 'video/mp4' }) :
                  null;

                return {
                  ...item,
                  modelData,
                  previewData,
                  url: null // URLs will be created when needed
                };
              }
              return item;
            })
          }));

          setProjects(restoredProjects);
          setSelectedProject(workspaceData.selectedProject);
          setGenerationInputs(workspaceData.generationInputs);
          setSelected3DModel(workspaceData.selected3DModel); // Updated from selectedModel
          setStarredImages(workspaceData.starredImages);
          if (workspaceData.selectedProvider) {
            setSelectedProvider(workspaceData.selectedProvider);
          }
          if (workspaceData.selectedTask) {
            setSelectedTask(workspaceData.selectedTask);
          }
        } catch (error) {
          console.error('Error parsing workspace file:', error);
          toast({
            title: "Error",
            description: "Failed to load workspace file. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('Are you sure you want to reset everything? This action cannot be undone.')) {
      setProjects([{ id: 1, name: 'Default', images: [] }]);
      setSelectedProject(1);
      setGenerationInputs(AIHORDE_DEFAULT_PARAMS);
      setSelectedModelName(''); // Updated from setSelectedModel
      setStarredImages({});
      setSelectedProvider('aihorde');
      setSelectedTask('Text to Image');
      await saveToIndexedDB('currentWorkspace', null);
      toast({
        title: "Success",
        description: "Workspace has been reset.",
      });
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const metadata = await extractMetadata(arrayBuffer);
        if (metadata) {
          setGenerationInputs(metadata);
          if (metadata.provider) {
            setSelectedProvider(metadata.provider);
          }
          
          const newImage = {
            id: Date.now(),
            url: URL.createObjectURL(file),
            thumbnail: URL.createObjectURL(file),
            generationInputs: metadata,
            provider: metadata.provider,
            status: 'completed'
          };
          
          setProjects(projects.map(project =>
            project.id === selectedProject
              ? { ...project, images: [...project.images, newImage] }
              : project
          ));
          
          toast({
            title: "Success",
            description: "Image uploaded and generation inputs updated!",
          });
        } else {
          toast({
            title: "Warning",
            description: "No valid metadata found in the image.",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImageClick = (item) => {
    if (item.type === '3d') {
      // Create temporary URLs for both model data and preview video
      const modelUrl = item.modelData ? URL.createObjectURL(new Blob([item.modelData], { type: 'model/gltf-binary' })) : null;
      const previewUrl = item.previewData ? URL.createObjectURL(item.previewData) : null;
      
      setSelected3DModel({ // Updated name
        ...item,
        modelUrl,
        url: previewUrl
      });
    } else {
      setSelectedImage(item);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen flex-col landscape:flex-row">
        <div className="landscape:block portrait:hidden">
          <Sidebar
            isOpen={projectPanelOpen}
            onToggle={() => setProjectPanelOpen(!projectPanelOpen)}
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
            onProjectAdd={handleAddProject}
            onProjectRename={handleRenameProject}
            onProjectRemove={handleRemoveProject}
            onProjectDownload={(id) => downloadProjectAsZip(projects.find(p => p.id === id))}
            onWorkspaceDownload={handleWorkspaceDownload}
            onWorkspaceUpload={handleWorkspaceUpload}
            onResetAll={handleResetAll}
            newProjectName={newProjectName}
            onNewProjectNameChange={setNewProjectName}
            fileInputRef={fileInputRef}
            selectedProvider={selectedProvider}
          />
        </div>

        <GenerationPanel
          isOpen={generationPanelOpen}
          onToggle={() => setGenerationPanelOpen(!generationPanelOpen)}
          generateContent={handleGenerateContent}
          openApiKeyDialog={() => setApiKeyDialogOpen(true)}
          generationInputs={generationInputs}
          selectedProvider={selectedProvider}
          onProviderChange={handleProviderChange}
          selectedModel={selectedModelName}
          setSelectedModel={setSelectedModelName}
          setGenerationInputs={setGenerationInputs}
          AIHordeProvider={AIHordeProvider}
          DeepInfraProvider={DeepInfraProvider}
          HuggingFaceProvider={HuggingFaceProvider}
          FyreanProvider={FyreanProvider}
          selectedTask={selectedTask}
          onTaskChange={setSelectedTask}
        />

      <div className={`flex-grow p-4 overflow-auto landscape:w-[60%] ${generationPanelOpen ? 'portrait:hidden' : ''}`}>
          <ImageGridControls
            onSelectAll={handleSelectAll}
            onUnselectAll={handleUnselectAll}
            onSelectStarred={handleSelectStarred}
            onInvertSelection={handleInvertSelection}
            onRemoveSelected={handleRemoveSelected}
            onDownloadZip={() => downloadSelectedImagesAsZip(currentImages, selectedImages)}
            onToggleStarFilter={() => setShowStarredOnly(!showStarredOnly)}
            showStarredOnly={showStarredOnly}
          />
      
      <ImageGrid
        images={currentImages.filter(image => !showStarredOnly || starredImages[image.id])}
        selectedImages={selectedImages}
        starredImages={starredImages}
        onImageSelect={handleImageSelect}
        onImageStar={handleImageStar}
        onImageRemove={handleImageRemove}
        onImageClick={handleImageClick}
        onFailedGenerationClick={(item) => {
          setSelectedError({
            error: item.metadata,
            inputs: item.generationInputs
          });
          setErrorDialogOpen(true);
        }}
      />
        </div>

        {selectedImage && (
          <ImageDetailsModal
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            setGenerationInputsFromImage={() => {
              if (selectedImage) {
                setGenerationInputs(selectedImage.generationInputs);
                setSelectedProvider(selectedImage.provider);
                setSelectedImage(null);
              }
            }}
            currentProject={currentProject}
          />
        )}

        {selected3DModel && (
          <ModelDetailsModal
            selectedModel={selected3DModel}
            setSelectedModel={setSelected3DModel}
          />
        )}

        <ApiKeyDialog
          isOpen={apiKeyDialogOpen}
          onClose={() => setApiKeyDialogOpen(false)}
          selectedProvider={selectedProvider}
          currentApiKey={currentApiKey}
          onApiKeyChange={setCurrentApiKey}
          onSave={() => {
            const newApiKeys = { ...apiKeys, [selectedProvider]: currentApiKey };
            setApiKeys(newApiKeys);
            saveToIndexedDB('apiKeys', newApiKeys);
            setApiKeyDialogOpen(false);
          }}
        />

        <GenerationErrorDialog
          isOpen={errorDialogOpen}
          onClose={() => {
            setErrorDialogOpen(false);
            setSelectedError(null);
          }}
          error={selectedError?.error}
          generationInputs={selectedError?.inputs}
        />

        {/*temp disable, do not remove!
        <FloatingUploadButton
          onUploadClick={() => uploadImageRef.current.click()}
          uploadRef={uploadImageRef}
        />*/}

        <input
          type="file"
          ref={uploadImageRef}
          style={{ display: 'none' }}
          onChange={handleUploadImage}
          accept="image/*"
        />

        <Toaster />
      </div>
    </ThemeProvider>
  );
};

export default ProjectGallery;
