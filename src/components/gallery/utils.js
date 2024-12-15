import { openDB } from 'idb';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DB_NAME = 'ImageGalleryDB_FYREAN';
const STORE_NAME = 'workspace';

export const openDatabase = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
};

export const saveToIndexedDB = async (key, value) => {
  const db = await openDatabase();
  await db.put(STORE_NAME, value, key);
};

export const getFromIndexedDB = async (key) => {
  const db = await openDatabase();
  return db.get(STORE_NAME, key);
};

export const createThumbnail = (imageData, maxWidth = 100, maxHeight = 100) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/webp'));
    };
    
    if (imageData.startsWith('data:image')) {
      img.src = imageData;
    } else {
      img.src = `data:image/png;base64,${imageData}`;
    }
  });
};

export const extractMetadata = async (arrayBuffer) => {
  const view = new DataView(arrayBuffer);
  let offset = 8; // Skip PNG signature

  while (offset < view.byteLength) {
    const length = view.getUint32(offset);
    offset += 4;
    const type = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    offset += 4;

    if (type === 'tEXt') {
      const dataView = new DataView(arrayBuffer, offset, length);
      const decoder = new TextDecoder();
      const text = decoder.decode(dataView);
      const [keyword, value] = text.split('\0');
      
      if (keyword === 'Comment') {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error('Error parsing metadata:', error);
          return null;
        }
      }
    }

    offset += length + 4; // Skip data and CRC
  }

  return null;
};

// Function to check if a blob is actually a WebP image
const isWebP = async (blob) => {
  const buffer = await blob.arrayBuffer();
  const arr = new Uint8Array(buffer);
  
  // Check for RIFF signature and WEBP in the header
  return arr.length >= 12 &&
    arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 && // RIFF
    arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50; // WEBP
};

const addItemToZip = async (zip, item, index, prefix = '') => {
  if (item.type === '3d' && item.modelData) {
    // For 3D models, just add the GLB file
    zip.file(`${prefix}model_${index + 1}.glb`, item.modelData);
  } else {
    // Handle image items
    const response = await fetch(item.url);
    const blob = await response.blob();
    const isWebPImage = await isWebP(blob);
    const extension = isWebPImage ? 'webp' : blob.type.split('/')[1];
    zip.file(`${prefix}image_${index + 1}.${extension}`, blob);
  }
};

export const downloadProjectAsZip = async (project) => {
  if (!project) return;

  const zip = new JSZip();
  const promises = project.images.map((item, index) => 
    addItemToZip(zip, item, index, `${project.name}/`)
  );

  await Promise.all(promises);
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${project.name}.zip`);
};

export const downloadSelectedImagesAsZip = async (images, selectedImages) => {
  const zip = new JSZip();
  const selectedItems = images.filter(item => selectedImages[item.id]);
  const promises = selectedItems.map((item, index) => 
    addItemToZip(zip, item, index)
  );

  await Promise.all(promises);
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `selected_items.zip`);
};

export const generatePrompts = (promptTemplate) => {
  const regex = /\{([^{}]+)\}/g;
  const parts = promptTemplate.split(regex);
  const optionsArray = [];
  
  for (let i = 1; i < parts.length; i += 2) {
    optionsArray.push(parts[i].split('|'));
  }

  return generateCombinations(parts.filter((_, i) => i % 2 === 0), optionsArray);
};

const generateCombinations = (parts, optionsArray, index = 0, current = '') => {
  if (index === parts.length - 1) {
    return [current + parts[index]];
  }

  let results = [];
  const options = optionsArray[index];

  for (const option of options) {
    const newCurrent = current + parts[index] + option;
    results = results.concat(generateCombinations(parts, optionsArray, index + 1, newCurrent));
  }

  return results;
};

export const generateRandomSeed = () => {
  return Math.floor(Math.random() * 10000000).toString();
};

export const extractWaitTime = (metadata) => {
  if (!metadata) return null;
  
  try {
    if (typeof metadata === 'object') {
      return metadata.wait_time;
    }
    
    if (typeof metadata === 'string') {
      if (metadata.trim().startsWith('{')) {
        const parsed = JSON.parse(metadata);
        return parsed.wait_time;
      }
      return null;
    }
  } catch (error) {
    console.log('Metadata is not JSON:', metadata);
    return null;
  }
  
  return null;
};
