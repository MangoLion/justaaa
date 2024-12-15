import React, { useState, useRef, useEffect } from 'react';
import { Brush, Eraser, RotateCcw, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const MaskEditor = ({ image, mask, onSave }) => {
  const [isBrushMode, setIsBrushMode] = useState(true);
  const [brushSize, setBrushSize] = useState(10);
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const compositeCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const lastPos = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setCanvasSize({ width: img.width, height: img.height });
        setTimeout(() => {
          initializeCanvases(img.width, img.height);
        }, 100);
      };
      img.src = image;
    }
  }, [image, mask]);

  const initializeCanvases = (width, height) => {
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const compositeCanvas = compositeCanvasRef.current;
    const imageCtx = imageCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    const compositeCtx = compositeCanvas.getContext('2d');
    const img = imageRef.current;

    imageCanvas.width = maskCanvas.width = compositeCanvas.width = width;
    imageCanvas.height = maskCanvas.height = compositeCanvas.height = height;

    imageCtx.clearRect(0, 0, width, height);
    imageCtx.drawImage(img, 0, 0, width, height);

    maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    maskCtx.clearRect(0, 0, width, height);

    if (mask) {
      const maskImg = new Image();
      maskImg.onload = () => {
        maskCtx.drawImage(maskImg, 0, 0, width, height);
        updateCompositeCanvas();
      };
      maskImg.src = mask;
    } else {
      updateCompositeCanvas();
    }
  };

  const updateCompositeCanvas = () => {
    const compositeCtx = compositeCanvasRef.current.getContext('2d');
    compositeCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    compositeCtx.drawImage(imageCanvasRef.current, 0, 0);
    compositeCtx.globalAlpha = 0.7;
    compositeCtx.drawImage(maskCanvasRef.current, 0, 0);
    compositeCtx.globalAlpha = 1;
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e);
    lastPos.current = { x: offsetX, y: offsetY };
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
    updateCompositeCanvas();
  };

  const getCoordinates = (e) => {
    const canvas = compositeCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      offsetX: (e.clientX - rect.left) * scaleX,
      offsetY: (e.clientY - rect.top) * scaleY
    };
  };

  const draw = (e) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const { offsetX, offsetY } = getCoordinates(e);

    ctx.globalCompositeOperation = isBrushMode ? 'source-over' : 'destination-out';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = brushSize * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
    } else {
      ctx.moveTo(offsetX, offsetY);
    }
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    lastPos.current = { x: offsetX, y: offsetY };

    updateCompositeCanvas();
  };

  const resetCanvas = () => {
    if (!maskCanvasRef.current) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCompositeCanvas();
  };

  const handleSave = () => {
    if (maskCanvasRef.current) {
      const newMask = maskCanvasRef.current.toDataURL('image/png');
      onSave(newMask);
    }
  };

  const downloadMask = () => {
    if (!maskCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'mask.png';
    link.href = maskCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  const updateCursorPosition = (e) => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="p-4">
      <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center">
        <div 
          style={{ position: 'relative', width: canvasSize.width, height: canvasSize.height }}
          onMouseMove={(e) => {
            updateCursorPosition(e);
            draw(e);
          }}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
        >
          <canvas
            ref={imageCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ position: 'absolute', top: 0, left: 0, display: 'none' }}
          />
          <canvas
            ref={maskCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ position: 'absolute', top: 0, left: 0, display: 'none' }}
          />
          <canvas
            ref={compositeCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
          <div
            className="pointer-events-none absolute border-2 border-white rounded-full"
            style={{
              width: `${brushSize * 2}px`,
              height: `${brushSize * 2}px`,
              left: `${cursorPosition.x - brushSize}px`,
              top: `${cursorPosition.y - brushSize}px`,
              transition: 'width 0.1s, height 0.1s, left 0.1s, top 0.1s',
            }}
          />
        </div>
      </div>
      <div className="absolute top-4 right-4 space-y-2 bg-background/80 p-2 rounded-lg">
        <Button
          variant={isBrushMode ? "secondary" : "outline"}
          size="icon"
          onClick={() => setIsBrushMode(true)}
        >
          <Brush className="h-4 w-4" />
        </Button>
        <Button
          variant={!isBrushMode ? "secondary" : "outline"}
          size="icon"
          onClick={() => setIsBrushMode(false)}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetCanvas}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={downloadMask}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
        </Button>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => setBrushSize(value[0])}
          max={50}
          step={1}
          className="h-[100px]"
        />
      </div>
    </div>
  );
};

export default MaskEditor;