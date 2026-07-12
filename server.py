
from fastapi import FastAPI, HTTPException, Body, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
import json
import os
import uuid
from dotenv import load_dotenv
import sys

# Add the current directory to sys.path so we can import from services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()
from services.ai_service import ai_service

app = FastAPI(title="Healthcare AI Backend")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File paths for simple JSON persistence
# We use a single file but structured as a dictionary of user_email -> data
DB_FILE = "health_database.json"
USERS_FILE = "users_db.json"

# Models
class Reminder(BaseModel):
    id: str
    time: str
    enabled: bool
    days: Optional[List[int]] = None
    message: Optional[str] = None

class Medication(BaseModel):
    id: str
    profileId: str
    name: str
    dosage: str
    frequency: str
    timeOfDay: List[str]
    remaining: int
    total: int
    instructions: Optional[str] = None
    reminders: List[Reminder]

class AdherenceRecord(BaseModel):
    date: str
    profileId: str
    medicationId: str
    taken: bool
    timeTaken: Optional[str] = None

class HealthLog(BaseModel):
    id: str
    profileId: str
    date: str
    type: str
    value: str
    unit: str

class NotificationsConfig(BaseModel):
    enabled: bool

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    age: str
    weight: str
    bloodType: str
    notifications: NotificationsConfig

class UserRegistration(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChatRequest(BaseModel):
    prompt: str

# Data Store structure
class UserHealthData(BaseModel):
    medications: List[Medication] = []
    adherence: List[AdherenceRecord] = []
    logs: List[HealthLog] = []
    profile: Optional[UserProfile] = None

def load_full_db() -> Dict[str, UserHealthData]:
    if not os.path.exists(DB_FILE):
        return {}
    try:
        with open(DB_FILE, "r") as f:
            content = f.read()
            if not content: return {}
            raw = json.loads(content)
            return {k: UserHealthData.parse_obj(v) for k, v in raw.items()}
    except Exception as e:
        print(f"Error loading database: {e}")
        return {}

def save_full_db(db: Dict[str, UserHealthData]):
    with open(DB_FILE, "w") as f:
        # Convert models to dict for JSON serialization
        json_ready = {k: v.dict() for k, v in db.items()}
        f.write(json.dumps(json_ready, indent=2))

def get_user_data(email: str) -> UserHealthData:
    db = load_full_db()
    return db.get(email, UserHealthData())

def save_user_data(email: str, data: UserHealthData):
    db = load_full_db()
    db[email] = data
    save_full_db(db)

def load_users() -> Dict:
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        content = f.read()
        return json.loads(content) if content else {}

def save_users(users: Dict):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

# Auth Endpoints
@app.post("/api/register")
async def register(user: UserRegistration):
    users = load_users()
    if user.email in users:
        raise HTTPException(status_code=400, detail="User already exists in database")
    
    user_id = str(uuid.uuid4())
    users[user.email] = {
        "name": user.name,
        "password": user.password,
        "id": user_id
    }
    save_users(users)
    
    # Initialize empty data for new user
    save_user_data(user.email, UserHealthData())
    
    return {"status": "success", "user": {"name": user.name, "email": user.email, "id": user_id}}

@app.post("/api/login")
async def login(credentials: UserLogin):
    users = load_users()
    user = users.get(credentials.email)
    if not user or user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials or user not found")
    
    return {"status": "success", "user": {"name": user["name"], "email": credentials.email, "id": user["id"]}}

# Data Endpoints - All require X-User-Email header for isolation
@app.get("/api/medications", response_model=List[Medication])
async def get_medications(x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    return data.medications

@app.post("/api/medications")
async def save_medications(meds: List[Medication], x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    data.medications = meds
    save_user_data(x_user_email, data)
    return {"status": "success"}

@app.get("/api/adherence", response_model=List[AdherenceRecord])
async def get_adherence(x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    return data.adherence

@app.post("/api/adherence")
async def save_adherence(records: List[AdherenceRecord], x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    data.adherence = records
    save_user_data(x_user_email, data)
    return {"status": "success"}

@app.get("/api/logs", response_model=List[HealthLog])
async def get_logs(x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    return data.logs

@app.post("/api/logs")
async def save_logs(logs: List[HealthLog], x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    data.logs = logs
    save_user_data(x_user_email, data)
    return {"status": "success"}

@app.get("/api/profile", response_model=Optional[UserProfile])
async def get_profile(x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    return data.profile

@app.post("/api/profile")
async def save_profile(profile: UserProfile, x_user_email: str = Header(...)):
    data = get_user_data(x_user_email)
    data.profile = profile
    save_user_data(x_user_email, data)
    return {"status": "success"}

# AI Chat Endpoint
@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    response_text = ai_service.generate_response(request.prompt)
    if not response_text:
        raise HTTPException(status_code=500, detail="Failed to generate response from AI Engine.")
    return {"response": response_text}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
