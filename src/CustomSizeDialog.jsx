import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, ArrowDownUp, Plus, Minus } from "lucide-react";

export const aspectRatios = [
  { label: 'Square (1:1)', width: 512, height: 512 },
  { label: 'Portrait (2:3)', width: 512, height: 768 },
  { label: 'Landscape (3:2)', width: 768, height: 512 },
  { label: 'Wide (16:9)', width: 896, height: 512 },
  { label: 'Tall (9:16)', width: 512, height: 896 },
  { label: 'Custom', width: null, height: null },
];

const CustomSizeDialog = ({ isOpen, onClose, width, height, onSizeChange, onConfirm }) => {
  const [isAspectLocked, setIsAspectLocked] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);

  useEffect(() => {
    if (isOpen) {
      setLocalWidth(width);
      setLocalHeight(height);
      setAspectRatio(width / height);
    }
  }, [isOpen, width, height]);

  const roundToNearest64 = (value) => {
    return Math.ceil(value / 64) * 64;
  };

  const handleWidthChange = (newWidth) => {
    const numWidth = Number(newWidth);
    setLocalWidth(numWidth);
    if (isAspectLocked && aspectRatio) {
      const newHeight = Math.round(numWidth / aspectRatio);
      setLocalHeight(newHeight);
    }
  };

  const handleHeightChange = (newHeight) => {
    const numHeight = Number(newHeight);
    setLocalHeight(numHeight);
    if (isAspectLocked && aspectRatio) {
      const newWidth = Math.round(numHeight * aspectRatio);
      setLocalWidth(newWidth);
    }
  };

  const handleFixDimension = (dimension) => {
    if (dimension === 'width') {
      const roundedWidth = roundToNearest64(localWidth);
      handleWidthChange(roundedWidth);
    } else {
      const roundedHeight = roundToNearest64(localHeight);
      handleHeightChange(roundedHeight);
    }
  };

  const handleIncrement = (dimension) => {
    if (dimension === 'width') {
      const roundedWidth = roundToNearest64(localWidth);
      handleWidthChange(roundedWidth + 64);
    } else {
      const roundedHeight = roundToNearest64(localHeight);
      handleHeightChange(roundedHeight + 64);
    }
  };

  const handleDecrement = (dimension) => {
    if (dimension === 'width') {
      const roundedWidth = roundToNearest64(localWidth);
      handleWidthChange(Math.max(64, roundedWidth - 64));
    } else {
      const roundedHeight = roundToNearest64(localHeight);
      handleHeightChange(Math.max(64, roundedHeight - 64));
    }
  };

  const handleSwap = () => {
    const tempWidth = localWidth;
    setLocalWidth(localHeight);
    setLocalHeight(tempWidth);
  };

  const toggleAspectLock = () => {
    setIsAspectLocked(!isAspectLocked);
    setAspectRatio(localWidth / localHeight);
  };

  const handleConfirm = () => {
    onSizeChange({ width: localWidth, height: localHeight });
    onConfirm();
  };

  const isWidthValid = localWidth % 64 === 0;
  const isHeightValid = localHeight % 64 === 0;
  const isValid = isWidthValid && isHeightValid;

  const renderDimensionControls = (dimension, value, isValueValid) => {
    if (!isValueValid) {
      return (
        <Button
          onClick={() => handleFixDimension(dimension)}
          variant="outline"
          size="icon"
          className="h-8 w-16 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
        >
          Fix
        </Button>
      );
    }

    return (
      <div className="flex">
        <Button
          onClick={() => handleDecrement(dimension)}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-r-none border-r-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => handleIncrement(dimension)}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-l-none"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Custom Size</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customWidth" className="text-right">
              Width
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="customWidth"
                type="number"
                value={localWidth}
                onChange={(e) => handleWidthChange(e.target.value)}
                className={!isWidthValid ? "border-red-500" : ""}
              />
              {renderDimensionControls('width', localWidth, isWidthValid)}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customHeight" className="text-right">
              Height
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="customHeight"
                type="number"
                value={localHeight}
                onChange={(e) => handleHeightChange(e.target.value)}
                className={!isHeightValid ? "border-red-500" : ""}
              />
              {renderDimensionControls('height', localHeight, isHeightValid)}
            </div>
          </div>
          {!isValid && (
            <p className="text-sm text-red-500">
              Both width and height must be divisible by 64
            </p>
          )}
        </div>
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              onClick={toggleAspectLock}
              variant="outline"
              className="flex items-center gap-2"
              title={isAspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {isAspectLocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              <span>{isAspectLocked ? "Unlock Ratio" : "Lock Ratio"}</span>
            </Button>
            <Button
              onClick={handleSwap}
              variant="outline"
              className="flex items-center gap-2"
              title="Swap dimensions"
            >
              <ArrowDownUp className="h-4 w-4" />
              <span>Swap</span>
            </Button>
          </div>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSizeDialog;