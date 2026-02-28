# 📬 Postman Collections — Carpooling Backend

This directory contains **separate Postman collections** for each module of the Carpooling Backend API.

## 📁 Collections

| Collection | File | Endpoints | Auth Required |
|---|---|---|---|
| **Auth** | `Auth-API.postman_collection.json` | 7 | No (returns tokens) |
| **User** | `User-API.postman_collection.json` | 5 | ✅ Bearer |
| **Vehicles** | `Vehicles-API.postman_collection.json` | 11 | ✅ Bearer |
| **Maps** | `Maps-API.postman_collection.json` | 6 | ✅ Bearer |
| **Travel Preferences** | `Travel-Preferences-API.postman_collection.json` | 2 | ✅ Bearer |
| **Publish Ride** | `Publish-Ride-API.postman_collection.json` | 15 | ✅ Bearer |
| **Search Ride** | `Search-Ride-API.postman_collection.json` | 5 | Partial |
| **Ride Booking** | `Ride-Booking-API.postman_collection.json` | 5 | ✅ Bearer |
| **Chat** | `Chat-API.postman_collection.json` | 7 REST + 8 WS | ✅ Bearer |
| **Notifications** | `Notifications-API.postman_collection.json` | 5 REST + 1 WS | ✅ Bearer |

## 🚀 Quick Start

### 1. Import Collections
Open Postman → **Import** → Select all `.postman_collection.json` files from this folder.

### 2. Set Variables
Each collection includes a `base_url` variable (default: `http://localhost:3000`).
Update it if your server runs on a different host or port.

### 3. Authenticate
1. Open **Auth API** collection.
2. Run **Signup** or **Login** → sends OTP to your email/phone.
3. Run **Verify OTP** with the code → auto-saves `access_token` and `refresh_token`.
4. Copy the `access_token` to other collections' variables.

### 4. Use Any Collection
All authenticated collections use `{{access_token}}` as the Bearer token.

## 🔄 Authentication Flow

```
Auth API: Signup/Login → OTP → Verify OTP
                                    ↓
                    access_token + refresh_token
                                    ↓
                    Use access_token in all other collections
                                    ↓
                    Refresh when expired (Auth → Refresh Access Token)
```

## 📝 Notes

- **Disabled query params** — Some requests have optional parameters shown as disabled. Enable them as needed.
- **WebSocket events** — Chat and Notifications collections include WebSocket event references. These cannot be tested directly in Postman but are documented for client implementation.
- **File uploads** — Endpoints like avatar upload and vehicle image upload use `form-data`. Select a file in the `image` field.
- **Draft flows** — Vehicles and Publish Ride use Redis-backed draft flows. Follow the numbered steps in order.
- **Variables** — Use `{{ride_id}}`, `{{booking_id}}`, `{{vehicle_id}}`, `{{conversation_id}}` etc. Set them from response data.

## 🗂 Legacy Collections

- `Carpooling.postman_collection.json` — Previous combined collection (all endpoints in one file).
- `Chat-Notifications-API.postman_collection.json` — Previous combined Chat + Notifications collection.

These are kept for backward compatibility but the new per-module collections are recommended.
