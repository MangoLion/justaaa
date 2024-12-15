import { CheckSquare, Star, Trash2, Download, Menu, FlipVertical, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ImageGridControls = ({
  onSelectAll,
  onUnselectAll,
  onSelectStarred,
  onInvertSelection,
  onRemoveSelected,
  onDownloadZip,
  onToggleStarFilter,
  showStarredOnly
}) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Menu className="mr-2 h-4 w-4" /> Gallery Controls
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onSelectAll}>
            <CheckSquare className="mr-2 h-4 w-4" /> Select All Items
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSelectStarred}>
            <Star className="mr-2 h-4 w-4" /> Select All Starred Items
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onUnselectAll}>
          <Square className="mr-2 h-4 w-4" /> Uncheck All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onInvertSelection}>
          <FlipVertical className="mr-2 h-4 w-4" /> Invert Selection
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRemoveSelected}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected Items
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownloadZip}>
            <Download className="mr-2 h-4 w-4" /> Download Selected Items
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleStarFilter}>
            <Star className={`mr-2 h-4 w-4 ${showStarredOnly ? 'text-yellow-400' : ''}`} />
            {showStarredOnly ? 'Show All Items' : 'Show Only Starred'}
          </DropdownMenuItem>

          
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ImageGridControls;
