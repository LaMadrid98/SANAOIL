from fastapi import FastAPI
from api.routes import router
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Include the router for API routes
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FAST API Server
if __name__ == "__main__":
    print("Starting FastAPI Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")  # [NEED TO BE CHANGED!!!!] based on your WiFi IP address

