import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Edit2, Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  return (
    <div className={`bg-gray-100 dark:bg-gray-800 ${isOpen ? 'w-64' : 'w-12'} transition-all duration-300 flex flex-col`}>
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
          
          {projects.map(project => (
            <div key={project.id} className="mb-2 flex items-center">
              <Button 
                variant={selectedProject === project.id ? "default" : "outline"}
                onClick={() => onProjectSelect(project.id)}
                className="flex-grow text-left max-w-[calc(100%-40px)] truncate"
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
                  <DropdownMenuItem onClick={() => onProjectRemove(project.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onProjectDownload(project.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          <div className="mt-auto space-y-2">
            <div className="text-center">
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

          <div className="text-center mt-4">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
              {selectedProvider.toUpperCase()}
            </h3>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          {projects.map(project => (
            <Button
              key={project.id}
              variant={selectedProject === project.id ? "default" : "outline"}
              onClick={() => onProjectSelect(project.id)}
              className="w-12 h-12 rounded-full"
            >
              {project.name[0].toUpperCase()}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
