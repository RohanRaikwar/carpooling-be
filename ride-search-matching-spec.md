# 🚗 Ride Search & Matching System – Complete Design Document

Author: Backend Architecture  
Purpose: Define full search ride logic for matching Rider requests with Driver published rides.

---

## 1️⃣ Problem Definition

We need to match:

**Driver Route:**
```
[Origin → W1 → W2 → ... → Wn → Destination]
```

**Rider Request:**
```
[Origin → Destination]
```

Matching must:
- Work within **5 KM** radius
- Respect route direction (**pickup before drop**)
- Support waypoint matching
- Support alternative route logic
- Return best matched rides sorted by score

---

## 2️⃣ Core Matching Rules

Let:

- `Ro` = Rider Origin
- `Rd` = Rider Destination
- `Do` = Driver Origin
- `Dd` = Driver Destination
- `Wi` = Driver Waypoints (ordered)

Build:

```
D_POINTS = [Do, W1, W2, ... Wn, Dd]
```

---

## 3️⃣ Primary Matching Conditions

### ✅ Condition 1 – Exact Origin & Destination Match
```
Ro matches Do (within 5km)
AND
Rd matches Dd (within 5km)
```
Best and strongest match.

---

### ✅ Condition 2 – Rider Points Match Anywhere on Route

Find indices `i` and `j` in `D_POINTS` such that:

```
distance(Ro, D_POINTS[i]) <= 5km
distance(Rd, D_POINTS[j]) <= 5km
AND
i < j
```

This ensures:
- Pickup happens before drop
- Route direction respected

Covers:
- Origin → Waypoint
- Waypoint → Destination
- Waypoint → Waypoint
- Origin → Destination

---

### ✅ Condition 3 – Waypoint to Waypoint Match
```
Ro matches Wi
Rd matches Wj
AND
i < j
```

---

### ✅ Condition 4 – Waypoint to Destination Match
```
Ro matches Wi
Rd matches Dd
AND
index(Wi) < index(Dd)
```

---

## 4️⃣ Business Conditions

### 4.1 5KM Radius Rule
All proximity matching must use:
```
RADIUS_KM = 5
```

---

### 4.2 On-the-Way Pickup Support
Rider origin and destination may match:
- Driver origin
- Driver destination
- Any waypoint

---

### 4.3 Alternative Route Matching
If:
- Rider points do not exactly match stored driver points  
BUT
- Rider origin & destination lie close to driver's **route polyline**

Then classify as:
```
ALT_ROUTE_MATCH
```

Optional enhancement:
- Decode polyline
- Check minimum distance from rider points to route path

---

## 5️⃣ Distance Calculation

Use Haversine formula:

```
R = 6371 km

dLat = toRad(lat2 - lat1)
dLng = toRad(lng2 - lng1)

a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLng/2)
c = 2 * atan2(√a, √(1−a))

distance = R * c
```

---

## 6️⃣ Matching Algorithm (Step-by-Step)

For each ride:
1. Reject if no seats available
2. Build ordered `D_POINTS`
3. Find all matching pickup indices
4. Find all matching drop indices
5. For each pair `(i, j)`:
   - if `i < j` → valid match
6. Choose best pair with smallest distance sum
7. Classify match type
8. Compute score
9. Add to results
10. Sort results by score descending

---

## 7️⃣ Pseudocode

```text
function matchRide(ride, rider):

    D_POINTS = [ride.origin] + sort(ride.waypoints) + [ride.destination]

    originMatches = []
    destMatches = []

    for idx in range(D_POINTS):
        if distance(rider.origin, D_POINTS[idx]) <= 5:
            originMatches.append(idx)

        if distance(rider.destination, D_POINTS[idx]) <= 5:
            destMatches.append(idx)

    bestMatch = null

    for i in originMatches:
        for j in destMatches:
            if i < j:
                pickupDistance = distance(rider.origin, D_POINTS[i])
                dropDistance   = distance(rider.destination, D_POINTS[j])
                cost = pickupDistance + dropDistance
                choose smallest cost

    if bestMatch == null:
        return NO_MATCH

    classifyMatch()
    computeScore()

    return MATCH_OBJECT
```

---

## 8️⃣ Scoring System

Base score:
```
score = 1000
score -= pickupDistance * 50
score -= dropDistance * 50
```

Bonuses:
- Exact origin-destination match: `+100`
- Pickup at driver origin: `+20`
- Drop at driver destination: `+20`

Penalty:
- Alternative route match: `-30`

---

## 9️⃣ Performance Optimization

### 9.1 Bounding Box Filter
Before Haversine:

```
latDelta ≈ 5 / 111 = 0.045°
lngDelta ≈ 5 / (111 * cos(latitude))
```

Skip rides outside this bounding box.

---

### 9.2 Database Optimization
- Index on `departureDate`
- Index on `availableSeats`
- For scale: store **Geohash / H3** cell for each point (origin/dest/waypoints) and query nearby cells

---

## 🔟 Output Response Format

Return:

```json
{
  "rideId": "string",
  "matchType": "COND_1 | COND_2 | COND_3 | COND_4 | ALT_ROUTE",
  "pickupMatchedPoint": "ORIGIN | WAYPOINT | DEST",
  "dropMatchedPoint": "ORIGIN | WAYPOINT | DEST",
  "pickupDistanceKm": 0.0,
  "dropDistanceKm": 0.0,
  "score": 0,
  "departureTime": "HH:mm",
  "price": 0,
  "seatsAvailable": 0
}
```

---

## 1️⃣1️⃣ Example Case

Driver:
Agra → Kosi Kalan → Delhi

Rider cases:

| Rider Route | Result |
|-------------|--------|
| Agra → Delhi | Condition 1 |
| Agra → Kosi Kalan | Condition 2 |
| Kosi Kalan → Delhi | Condition 4 |
| Kosi Kalan → Kosi Kalan | Rejected (pickup must be before drop) |

---

## 1️⃣2️⃣ Validation Rules
- Pickup index must be `<` Drop index
- Distance must be `<= 5km`
- Seats must be available
- Time window must match (optional filter)

---

## 1️⃣3️⃣ Advanced Enhancements (Future)
- ETA deviation calculation
- Dynamic pricing based on pickup point
- Multi-rider batching
- Real-time traffic re-score
- ML-based ranking model

---

## 1️⃣4️⃣ Final Summary

The ride search engine:

✅ Supports waypoint matching  
✅ Enforces direction validation  
✅ Supports 5km radius proximity  
✅ Allows alternative route detection  
✅ Returns ranked best rides  
✅ Scales with geospatial indexing  

---

END OF DOCUMENT
