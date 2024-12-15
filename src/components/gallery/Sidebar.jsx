import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Edit2, Trash2, Download, Upload, RefreshCw, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { useState } from 'react';

const ALL_PROJECTS_ID = 'all';

const Sidebar = ({
  isOpen,
  onToggle,
  projects,
  selectedProject,
  onProjectSelect,
  onProjectAdd,
  onProjectRename,
  onProjectRemove,
  onProjectDownload,
  onWorkspaceDownload,
  onWorkspaceUpload,
  onResetAll,
  newProjectName,
  onNewProjectNameChange,
  fileInputRef,
  selectedProvider
}) => {
  const regularProjects = projects.filter(project => project.id !== ALL_PROJECTS_ID);
  const showAllProjects = regularProjects.length > 1;
  const selectedProjectStyle = "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white";

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 ${isOpen ? 'w-64' : 'w-12'} transition-all duration-300 flex flex-col h-full`}>
      {/* Hidden file input for workspace upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={onWorkspaceUpload}
      />
      
      <div className="h-10">
        <Button 
          onClick={onToggle} 
          className="w-full h-full rounded-none bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          {isOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
        </Button>
      </div>
      
      {isOpen ? (
        <>
          <div className="flex flex-col flex-grow">
            <div className="mb-4">
              <Input 
                placeholder="New Project Name" 
                value={newProjectName} 
                onChange={(e) => onNewProjectNameChange(e.target.value)}
                className="mb-2"
              />
              <Button onClick={onProjectAdd} className="w-full">
                <Plus className="mr-2" /> Add Project
              </Button>
            </div>

            <div className="flex-grow overflow-auto">
              {showAllProjects && (
                <div className="mb-2 flex items-center">
                  <Button 
                    variant={selectedProject === ALL_PROJECTS_ID ? "default" : "outline"}
                    onClick={() => onProjectSelect(ALL_PROJECTS_ID)}
                    className={`flex-grow text-left max-w-full truncate ${selectedProject === ALL_PROJECTS_ID ? selectedProjectStyle : ''}`}
                  >
                    <span className="truncate block">All Projects</span>
                  </Button>
                </div>
              )}
              
              {regularProjects.map((project, index) => (
                <div key={project.id} className="mb-2 flex items-center">
                  <Button 
                    variant={selectedProject === project.id ? "default" : "outline"}
                    onClick={() => onProjectSelect(project.id)}
                    className={`flex-grow text-left max-w-[calc(100%-40px)] truncate ${selectedProject === project.id ? selectedProjectStyle : ''}`}
                  >
                    <span className="truncate block">{project.name}</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        const newName = prompt("Enter new name:", project.name);
                        if (newName) onProjectRename(project.id, newName);
                      }}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      {index !== 0 && (
                        <DropdownMenuItem onClick={() => onProjectRemove(project.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onProjectDownload(project.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-2 pb-4">
              <div className="text-center">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="mx-auto mb-2 flex items-center justify-center">
                    <Info className="h-4 w-4 mr-2" /> About
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="flex flex-col items-center text-center">
                  <DrawerHeader className="text-center">
                  <DrawerTitle className="text-center">Just Another AI App</DrawerTitle>
                  <DrawerDescription className="max-w-2xl mx-auto text-center">
                    A modern React web application built with Vite and ShadCN UI that empowers content creators to seamlessly generate images and 3D models using various free and open-source AI endpoints. Switch effortlessly between services like AI Horde and HuggingFace to create your content.
                  </DrawerDescription>
                </DrawerHeader>
                    <div className="p-4 w-full max-w-2xl">
                      <h3 className="text-lg font-semibold mb-2 text-center">Features</h3>
                      <ul className="list-none space-y-1 flex flex-col items-center">
                        <li>🎨 Generate images using multiple AI providers</li>
                        <li>🔄 Easy switching between different AI endpoints</li>
                        <li>🖼️ Built-in gallery for managing generated content</li>
                        <li>🎭 Mask editing capabilities</li>
                        <li>🚀 Express mode for quick generations</li>
                        <li>🔍 Integrated CivitAI model search</li>
                      </ul>
                      <p className="mt-4 text-sm text-gray-500 text-center">version 1.0</p>
                    </div>
                    <DrawerFooter className="flex justify-center">
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
                <br/>
                <Label className="text-sm font-medium">Workspace</Label>
              </div>
              <Separator />
              <div className="flex space-x-2 items-center justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onWorkspaceDownload} size="icon" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download Workspace</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => fileInputRef.current.click()} size="icon" variant="outline">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload Workspace</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button onClick={onResetAll} variant="destructive" size="sm" className="ml-2">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reset All
                </Button>
              </div>
            </div>

            
          </div>
        </>
      ) : (
        <div className="flex flex-col w-full">
          {showAllProjects && (
            <div className="mb-2">
              <Button
                variant={selectedProject === ALL_PROJECTS_ID ? "default" : "outline"}
                onClick={() => onProjectSelect(ALL_PROJECTS_ID)}
                className={`w-full h-10 rounded-md ${selectedProject === ALL_PROJECTS_ID ? selectedProjectStyle : ''}`}
              >
                A
              </Button>
            </div>
          )}
          {regularProjects.map(project => (
            <div key={project.id} className="mb-2">
              <Button
                variant={selectedProject === project.id ? "default" : "outline"}
                onClick={() => onProjectSelect(project.id)}
                className={`w-full h-10 rounded-md ${selectedProject === project.id ? selectedProjectStyle : ''}`}
              >
                {project.name[0].toUpperCase()}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
