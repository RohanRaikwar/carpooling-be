# Carpooling Backend - Complete Testing Guide

## Overview
This guide explains how to run the authentication tests and test the authentication flow using Postman or a frontend application.

---

## 1. Running the Tests

### Prerequisites
- MongoDB running (locally or via Docker)
- Redis running (locally or via Docker)
- Node.js installed

### Start Infrastructure (if using Docker)
```bash
docker-compose up -d
```

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- authFlow.test.ts
```

### Expected Test Output
The tests will verify:
- ✅ User signup with email
- ✅ OTP verification and token generation
- ✅ Login with password

---

## 2. Running the Server

### Step 1: Set Up Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/carpooling
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
NODE_ENV=development
```

### Step 2: Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
Server running on port 3000
MongoDB connected
Redis connected
```

---

## 3. Testing with Postman

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Flow

#### **Step 1: Signup (Email + Password)**

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "method": "email",
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Expected Response (201):**
```json
{
  "message": "Signup successful, please verify OTP",
  "next": "verify_otp",
  "otpId": "simulated_otp_id"
}
```

**Note:** Check your server console logs to see the OTP (in development, it's logged):
```
[MOCK] Sending OTP 123456 to user@example.com via email
```

---

#### **Step 2: Verify OTP**

**Endpoint:** `POST /auth/otp/verify`

**Request Body:**
```json
{
  "method": "email",
  "identifier": "user@example.com",
  "code": "123456",
  "purpose": "signup"
}
```

**Expected Response (200):**
```json
{
  "message": "Verification successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  },
  "next": "home"
}
```

**Save the tokens** for authenticated requests!

---

#### **Step 3: Login with Password**

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "method": "email",
  "identifier": "user@example.com",
  "password": "SecurePass123"
}
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

#### **Step 4: Request OTP (Alternative Login)**

**Endpoint:** `POST /auth/otp/request`

**Request Body:**
```json
{
  "method": "email",
  "identifier": "user@example.com",
  "purpose": "login"
}
```

**Expected Response (200):**
```json
{
  "message": "OTP sent"
}
```

Then verify with the same `/auth/otp/verify` endpoint (use `"purpose": "login"`).

---

#### **Step 5: Refresh Access Token**

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### **Step 6: Logout**

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Protected Endpoints (Requires Authentication)

For protected routes, add the access token to your request headers:

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example - Get User Profile:**

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer <your_access_token>
```

**Expected Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "user",
  "status": "active",
  "isVerified": true
}
```

---

## 4. Testing with Frontend

### Using Fetch API

#### Signup
```javascript
const signup = async () => {
  const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'email',
      email: 'user@example.com',
      password: 'SecurePass123',
      name: 'John Doe'
    })
  });
  
  const data = await response.json();
  console.log(data);
  // Show OTP input form
};
```

#### Verify OTP
```javascript
const verifyOTP = async (otp) => {
  const response = await fetch('http://localhost:3000/api/v1/auth/otp/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'email',
      identifier: 'user@example.com',
      code: otp,
      purpose: 'signup'
    })
  });
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  // Redirect to home
  window.location.href = '/home';
};
```

#### Login
```javascript
const login = async () => {
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'email',
      identifier: 'user@example.com',
      password: 'SecurePass123'
    })
  });
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};
```

#### Make Authenticated Request
```javascript
const getProfile = async () => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch('http://localhost:3000/api/v1/users/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  const data = await response.json();
  return data;
};
```

#### Handle Token Refresh
```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  // Update tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.accessToken;
};

// Axios interceptor example for auto-refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return axios(originalRequest);
    }
    
    return Promise.reject(error);
  }
);
```

---

## 5. Common Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid or expired OTP"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials"
}
```

### 409 Conflict
```json
{
  "message": "User already exists"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many OTP requests"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## 6. Postman Collection Setup

### Create a Postman Collection

1. **Create Environment Variables:**
   - `base_url`: `http://localhost:3000/api/v1`
   - `access_token`: (will be set automatically)
   - `refresh_token`: (will be set automatically)

2. **Add Test Scripts to Save Tokens:**

For the **Verify OTP** and **Login** requests, add this to the "Tests" tab:

```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.accessToken);
    pm.environment.set("refresh_token", jsonData.refreshToken);
}
```

3. **Use Variables in Requests:**
   - URL: `{{base_url}}/auth/login`
   - Authorization Header: `Bearer {{access_token}}`

---

## 7. Testing Checklist

- [ ] Start MongoDB and Redis
- [ ] Start the server (`npm run dev`)
- [ ] Test signup flow
- [ ] Check server logs for OTP
- [ ] Test OTP verification
- [ ] Test password login
- [ ] Test OTP login
- [ ] Test token refresh
- [ ] Test logout
- [ ] Test protected endpoints with valid token
- [ ] Test protected endpoints with invalid/expired token

---

## 8. Development Tips

### View Server Logs
The server logs all OTP codes in development mode. Check your console:
```
[MOCK] Sending OTP 123456 to user@example.com via email
```

### Check MongoDB Data
```bash
# Connect to MongoDB
mongosh

# Switch to database
use carpooling

# View users
db.users.find().pretty()

# View refresh tokens
db.refreshtokens.find().pretty()
```

### Check Redis Data
```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Get OTP for a user
GET otp:signup:user@example.com

# Check rate limit
GET rate_limit:user@example.com
```

---

## 9. Next Steps

- Integrate real email service (SendGrid, AWS SES)
- Integrate real SMS service (Twilio)
- Add more comprehensive tests
- Set up CI/CD pipeline
- Deploy to production

---

## Support

For issues or questions, check:
- Server logs in the console
- MongoDB connection status
- Redis connection status
- Request/response payloads in Postman
