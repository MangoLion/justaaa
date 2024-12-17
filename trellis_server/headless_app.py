import os
from typing import *
import torch
import numpy as np
import imageio
import uuid
import time
from datetime import datetime
from collections import deque, defaultdict
from easydict import EasyDict as edict
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import FileResponse, JSONResponse
from trellis.pipelines import TrellisImageTo3DPipeline
from trellis.representations import Gaussian, MeshExtractResult
from trellis.utils import render_utils, postprocessing_utils
from rembg import remove, new_session
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

MAX_SEED = np.iinfo(np.int32).max
TMP_DIR = "/workspace/Trellis-demo"
os.makedirs(TMP_DIR, exist_ok=True)

# Initialize rembg session
rembg_session = new_session()

# Request tracking
class RequestTracker:
    def __init__(self):
        self.active_requests = {}  # trial_id -> request info
        self.completed_requests = deque(maxlen=100)  # Keep last 100 completed requests
        self.request_history = []  # List to track processing times
        self.session_results = defaultdict(dict)  # session_id -> {trial_id -> result}
    
    def add_request(self, trial_id: str, session_id: str) -> dict:
        position = len(self.active_requests)
        request_info = {
            'trial_id': trial_id,
            'session_id': session_id,
            'start_time': datetime.now(),
            'status': 'queued',
            'queue_position': position
        }
        self.active_requests[trial_id] = request_info
        return request_info
    
    def start_processing(self, trial_id: str):
        if trial_id in self.active_requests:
            self.active_requests[trial_id]['status'] = 'processing'
            self.active_requests[trial_id]['processing_start'] = datetime.now()
    
    def complete_request(self, trial_id: str, result: dict = None):
        if trial_id in self.active_requests:
            end_time = datetime.now()
            request = self.active_requests[trial_id]
            request['end_time'] = end_time
            request['status'] = 'completed'
            
            # Store result for the session
            if result:
                session_id = request['session_id']
                self.session_results[session_id][trial_id] = result
            
            # Calculate processing time
            processing_time = (end_time - request['processing_start']).total_seconds()
            self.request_history.append(processing_time)
            if len(self.request_history) > 100:
                self.request_history.pop(0)
            
            # Move to completed requests
            self.completed_requests.append(request)
            del self.active_requests[trial_id]
    
    def get_result(self, trial_id: str, session_id: str) -> Optional[dict]:
        return self.session_results.get(session_id, {}).get(trial_id)
    
    def get_stats(self) -> dict:
        active_count = len(self.active_requests)
        avg_processing_time = np.mean(self.request_history) if self.request_history else 0
        
        return {
            'requests_in_queue': active_count,
            'average_processing_time': round(avg_processing_time, 2),
            'active_requests': [
                {
                    'trial_id': req['trial_id'],
                    'wait_time': (datetime.now() - req['start_time']).total_seconds(),
                    'status': req['status'],
                    'queue_position': req['queue_position']
                }
                for req in self.active_requests.values()
            ]
        }
    
    def estimate_wait_time(self, position: int) -> float:
        if not self.request_history:
            return 0
        avg_time = np.mean(self.request_history)
        return round(avg_time * (position + 1), 2)  # +1 because position is 0-based

request_tracker = RequestTracker()

def cleanup_old_files(directory: str, max_age_hours: int = 24):
    """Clean up files older than max_age_hours"""
    current_time = time.time()
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            try:
                # If file is older than max_age_hours or is a temporary file from a completed request
                is_old = (current_time - os.path.getmtime(filepath)) > (max_age_hours * 3600)
                is_completed_temp = any(
                    req['trial_id'] in filename 
                    for req in request_tracker.completed_requests
                )
                
                if is_old or is_completed_temp:
                    os.remove(filepath)
            except OSError:
                pass

def cleanup_request_files(trial_id: str):
    """Clean up files associated with a specific request"""
    for filename in os.listdir(TMP_DIR):
        if trial_id in filename:
            try:
                os.remove(os.path.join(TMP_DIR, filename))
            except OSError:
                pass

@app.on_event("startup")
async def startup_event():
    """Run cleanup on startup"""
    cleanup_old_files(TMP_DIR)

# Initialize pipeline globally
pipeline = TrellisImageTo3DPipeline.from_pretrained("JeffreyXiang/TRELLIS-image-large")
pipeline.cuda()

def needs_background_removal(image: Image.Image) -> bool:
    """Check if image needs background removal (no alpha channel or fully opaque)"""
    if 'A' not in image.getbands():
        return True
    if 'A' in image.getbands():
        # Check if alpha channel is all 255 (fully opaque)
        alpha = image.getchannel('A')
        return np.array(alpha).min() == 255
    return True

def preprocess_image(image: Image.Image) -> Tuple[str, Image.Image]:
    trial_id = str(uuid.uuid4())
    
    # Check if background removal is needed
    if needs_background_removal(image):
        image = remove(image, session=rembg_session)
    
    processed_image = pipeline.preprocess_image(image)
    processed_image.save(f"{TMP_DIR}/{trial_id}.png")
    return trial_id, processed_image

def pack_state(gs: Gaussian, mesh: MeshExtractResult, trial_id: str) -> dict:
    return {
        'gaussian': {
            **gs.init_params,
            '_xyz': gs._xyz.cpu().numpy().tolist(),
            '_features_dc': gs._features_dc.cpu().numpy().tolist(),
            '_scaling': gs._scaling.cpu().numpy().tolist(),
            '_rotation': gs._rotation.cpu().numpy().tolist(),
            '_opacity': gs._opacity.cpu().numpy().tolist(),
        },
        'mesh': {
            'vertices': mesh.vertices.cpu().numpy().tolist(),
            'faces': mesh.faces.cpu().numpy().tolist(),
        },
        'trial_id': trial_id,
    }

@app.post("/process-image")
async def process_image(
    file: UploadFile = File(...),
    session_id: str = Query(...),
    seed: int = 0,
    randomize_seed: bool = True,
    ss_guidance_strength: float = 7.5,
    ss_sampling_steps: int = 12,
    slat_guidance_strength: float = 3.0,
    slat_sampling_steps: int = 12,
    mesh_simplify: float = 0.95,
    texture_size: int = 1024
):
    # Run cleanup before processing new image
    cleanup_old_files(TMP_DIR)
    
    # Read and process the uploaded image
    image = Image.open(file.file)
    trial_id, processed_image = preprocess_image(image)
    
    try:
        # Add request to tracker and get queue info
        request_info = request_tracker.add_request(trial_id, session_id)
        estimated_wait = request_tracker.estimate_wait_time(request_info['queue_position'])
        
        # Generate 3D model
        if randomize_seed:
            seed = np.random.randint(0, MAX_SEED)
        
        request_tracker.start_processing(trial_id)
        
        outputs = pipeline.run(
            processed_image,
            seed=seed,
            formats=["gaussian", "mesh"],
            preprocess_image=False,
            sparse_structure_sampler_params={
                "steps": ss_sampling_steps,
                "cfg_strength": ss_guidance_strength,
            },
            slat_sampler_params={
                "steps": slat_sampling_steps,
                "cfg_strength": slat_guidance_strength,
            },
        )
        
        # Generate preview video (no concatenation)
        video = render_utils.render_video(outputs['gaussian'][0], num_frames=120)['color']
        video_path = f"{TMP_DIR}/{trial_id}_preview.mp4"
        imageio.mimsave(video_path, video, fps=15)
        
        # Generate GLB
        glb_path = f"{TMP_DIR}/{trial_id}.glb"
        glb = postprocessing_utils.to_glb(
            outputs['gaussian'][0], 
            outputs['mesh'][0], 
            simplify=mesh_simplify, 
            texture_size=texture_size, 
            verbose=False
        )
        glb.export(glb_path)
        
        # Pack state and mark request as complete
        state = pack_state(outputs['gaussian'][0], outputs['mesh'][0], trial_id)
        
        # Save state file (might be useful for debugging)
        with open(f"{TMP_DIR}/{trial_id}_state.json", 'w') as f:
            json.dump(state, f)
        
        # Read files as bytes
        with open(video_path, 'rb') as f:
            preview_bytes = f.read()
        with open(glb_path, 'rb') as f:
            glb_bytes = f.read()
        
        result = {
            "trial_id": trial_id,
            "preview_video": preview_bytes,
            "glb_model": glb_bytes,
            "queue_info": {
                "position": request_info['queue_position'],
                "estimated_wait_seconds": estimated_wait
            }
        }
        
        request_tracker.complete_request(trial_id, result)
        
        # Clean up files for this request after processing
        cleanup_request_files(trial_id)
        
        return JSONResponse(
            content={
                "trial_id": trial_id,
                "preview_video_base64": preview_bytes.hex(),
                "glb_model_base64": glb_bytes.hex(),
                "queue_info": {
                    "position": request_info['queue_position'],
                    "estimated_wait_seconds": estimated_wait
                }
            }
        )
    except Exception as e:
        # Clean up files in case of error
        cleanup_request_files(trial_id)
        raise e

@app.get("/health")
async def health_check():
    stats = request_tracker.get_stats()
    return {
        "status": "ok",
        "queue_stats": stats
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)