# FinShadow API Endpoints Documentation

## Overview
Complete REST API for FinShadow's financial cybersecurity & threat intelligence platform.

Base URL: `/api`

---

## Health Check

### GET `/api/health`
Check if the API is operational.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-15T10:30:00Z"
}
```

---

## Authentication

### POST `/api/auth/register`
Register a new user account.

**Request:**
```json
{
  "username": "analyst1",
  "password": "secure_password",
  "email": "analyst@example.com",
  "role": "analyst"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "analyst1",
  "email": "analyst@example.com"
}
```

**Errors:**
- `400`: Invalid input
- `409`: Username already exists

---

### POST `/api/auth/login`
Authenticate a user.

**Request:**
```json
{
  "username": "analyst1",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "analyst1",
  "email": "analyst@example.com",
  "role": "analyst"
}
```

**Errors:**
- `400`: Missing credentials
- `401`: Invalid credentials

---

## Transactions

### GET `/api/transactions`
Fetch transactions for a user.

**Query Parameters:**
- `userId` (string): User ID (defaults to "user-1")
- `limit` (number): Results per page (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "txn-001",
    "userId": "user-1",
    "amount": "5000.00",
    "currency": "USD",
    "type": "transfer",
    "status": "completed",
    "sourceAccount": "ACC-123",
    "destinationAccount": "ACC-456",
    "flags": { "veryHighAmount": true },
    "riskScore": 45,
    "ipAddress": "192.168.1.1",
    "geolocation": "US",
    "timestamp": "2025-12-15T10:00:00Z",
    "createdAt": "2025-12-15T10:00:00Z"
  }
]
```

---

### GET `/api/transactions/:id`
Fetch a specific transaction by ID.

**Response:** Single transaction object

**Errors:**
- `404`: Transaction not found

---

### POST `/api/transactions`
Create a new transaction record.

**Request:**
```json
{
  "userId": "user-1",
  "amount": "2500.50",
  "currency": "USD",
  "type": "payment",
  "sourceAccount": "ACC-123",
  "destinationAccount": "ACC-789",
  "ipAddress": "192.168.1.1",
  "geolocation": "US"
}
```

**Response (201):** Transaction object with generated ID

---

### PUT `/api/transactions/:id`
Update transaction details (risk score, flags, status).

**Request:**
```json
{
  "status": "flagged",
  "riskScore": 75,
  "flags": { "suspiciousGeolocation": true }
}
```

**Response:** Updated transaction object

**Errors:**
- `404`: Transaction not found

---

## Fraud Findings

### GET `/api/fraud/findings`
Retrieve fraud detection results.

**Query Parameters:**
- `status` (string): Filter by status (new, investigating, resolved)
- `limit` (number): Results per page (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "FR-2024-8892",
    "transactionId": "txn-001",
    "type": "account_takeover",
    "severity": "critical",
    "status": "new",
    "details": "Multiple high-value transfers to unverified external accounts",
    "evidence": { "attempts": 5, "timeframe": "30 minutes" },
    "investigatedBy": null,
    "resolvedAt": null,
    "timestamp": "2025-12-15T10:00:00Z",
    "createdAt": "2025-12-15T10:00:00Z"
  }
]
```

---

### GET `/api/fraud/findings/:id`
Fetch a specific fraud finding.

**Response:** Single fraud finding object

**Errors:**
- `404`: Fraud finding not found

---

### POST `/api/fraud/findings`
Create a new fraud finding.

**Request:**
```json
{
  "transactionId": "txn-001",
  "type": "credential_stuffing",
  "severity": "high",
  "details": "500+ failed login attempts detected",
  "evidence": { "attempts": 500, "timeframe": "5 minutes" }
}
```

**Response (201):** Fraud finding object

---

### PUT `/api/fraud/findings/:id`
Update fraud finding details.

**Request:**
```json
{
  "status": "investigating",
  "evidence": { "newField": "newValue" }
}
```

**Response:** Updated fraud finding object

**Errors:**
- `404`: Fraud finding not found

---

### POST `/api/fraud/findings/:id/investigate`
Mark a fraud finding as under investigation.

**Request:**
```json
{
  "userId": "analyst-1"
}
```

**Response:** Updated fraud finding with status="investigating"

**Errors:**
- `404`: Fraud finding not found

---

### POST `/api/fraud/findings/:id/resolve`
Mark a fraud finding as resolved.

**Request:** (empty body)

**Response:** Updated fraud finding with status="resolved" and resolvedAt timestamp

**Errors:**
- `404`: Fraud finding not found

---

## Threat Actors

### GET `/api/threats/actors`
Fetch threat actor intelligence.

**Query Parameters:**
- `limit` (number): Results per page (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "TA-001",
    "name": "Cobalt Mirage",
    "aliases": ["UNC2452", "DarkHalo"],
    "riskLevel": "critical",
    "origin": "Eastern Europe",
    "lastSeen": "2025-12-15T09:30:00Z",
    "targets": ["Fintech", "Banking", "Crypto"],
    "capabilities": ["Ransomware", "Supply Chain", "Zero-day"],
    "timestamp": "2025-12-15T10:00:00Z"
  }
]
```

---

### GET `/api/threats/actors/:id`
Fetch a specific threat actor.

**Response:** Single threat actor object

**Errors:**
- `404`: Threat actor not found

---

### POST `/api/threats/actors`
Create or add a new threat actor to tracking.

**Request:**
```json
{
  "id": "TA-005",
  "name": "New Threat Group",
  "aliases": ["Alias1", "Alias2"],
  "riskLevel": "high",
  "origin": "Unknown",
  "targets": ["Finance"],
  "capabilities": ["Phishing"]
}
```

**Response (201):** Threat actor object

---

### PUT `/api/threats/actors/:id`
Update threat actor information.

**Request:**
```json
{
  "riskLevel": "critical",
  "lastSeen": "2025-12-15T10:30:00Z",
  "capabilities": ["Ransomware", "Supply Chain", "Zero-day", "New Capability"]
}
```

**Response:** Updated threat actor object

**Errors:**
- `404`: Threat actor not found

---

## Dark Web Intelligence

### GET `/api/dark-web/intel`
Fetch dark web monitoring results.

**Query Parameters:**
- `severity` (string): Filter by severity (critical, high, medium, low)
- `limit` (number): Results per page (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "INT-992",
    "source": "DeepWeb Forum X",
    "content": "Selling new exploit kit for FinShadow banking API v2.1",
    "severity": "critical",
    "tags": ["Exploit", "Banking", "API"],
    "reference": "https://forum.example.com/post/12345",
    "verifiedAt": "2025-12-15T10:15:00Z",
    "discoveredAt": "2025-12-15T10:10:00Z",
    "createdAt": "2025-12-15T10:10:00Z"
  }
]
```

---

### GET `/api/dark-web/intel/:id`
Fetch a specific intelligence item.

**Response:** Single dark web intel object

**Errors:**
- `404`: Intel not found

---

### POST `/api/dark-web/intel`
Create a new dark web intelligence entry.

**Request:**
```json
{
  "source": "Telegram Channel",
  "content": "Dump of 50k credit cards available",
  "severity": "high",
  "tags": ["Carding", "Data Dump"],
  "reference": "telegram-group-id-123"
}
```

**Response (201):** Dark web intel object

---

## Predictions

### GET `/api/predictions`
Fetch AI-generated risk predictions.

**Query Parameters:**
- `limit` (number): Results per page (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "PRED-001",
    "target": "Payment Gateway North America",
    "riskScore": 88,
    "likelyAttackType": "DDoS & Credential Stuffing",
    "projectedImpact": "Service degradation, 15% transaction failure",
    "aiConfidence": 92,
    "region": "North America",
    "timestamp": "2025-12-15T10:00:00Z"
  }
]
```

---

### GET `/api/predictions/:id`
Fetch a specific prediction.

**Response:** Single prediction object

**Errors:**
- `404`: Prediction not found

---

### POST `/api/predictions`
Create a new prediction.

**Request:**
```json
{
  "target": "API Endpoint X",
  "riskScore": 75,
  "likelyAttackType": "SQL Injection",
  "projectedImpact": "Data leakage risk",
  "aiConfidence": 85,
  "region": "Global"
}
```

**Response (201):** Prediction object

---

## Alerts

### GET `/api/alerts`
Fetch alerts for a user.

**Query Parameters:**
- `userId` (string): User ID (defaults to "user-1")
- `unreadOnly` (boolean): Filter unread alerts (default: false)
- `limit` (number): Results per page (default: 20)
- `offset` (number): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "ALT-001",
    "userId": "user-1",
    "type": "fraud",
    "title": "Critical Fraud Detected",
    "message": "Account takeover attempt detected",
    "severity": "critical",
    "read": false,
    "relatedId": "FR-2024-8892",
    "createdAt": "2025-12-15T10:00:00Z"
  }
]
```

---

### GET `/api/alerts/:id`
Fetch a specific alert.

**Response:** Single alert object

**Errors:**
- `404`: Alert not found

---

### POST `/api/alerts`
Create a new alert.

**Request:**
```json
{
  "userId": "user-1",
  "type": "threat",
  "title": "New Threat Actor",
  "message": "Critical threat actor activity detected",
  "severity": "high",
  "relatedId": "TA-001"
}
```

**Response (201):** Alert object

---

### PUT `/api/alerts/:id/read`
Mark an alert as read.

**Request:** (empty body)

**Response:** Updated alert with read=true

**Errors:**
- `404`: Alert not found

---

## Stats & Dashboard

### GET `/api/stats`
Fetch overall system statistics.

**Response:**
```json
{
  "activeThreats": 12,
  "fraudAttemptsBlocked": 1450,
  "systemRiskScore": 72,
  "aiConfidenceAvg": 89
}
```

---

### GET `/api/dashboard`
Fetch complete dashboard data (combined stats and recent items).

**Response:**
```json
{
  "stats": {
    "activeThreats": 12,
    "fraudAttemptsBlocked": 1450,
    "systemRiskScore": 72,
    "aiConfidenceAvg": 89
  },
  "recentFindings": [ ... ],
  "predictions": [ ... ],
  "threatActors": [ ... ]
}
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation error)
- `401`: Unauthorized
- `404`: Resource not found
- `409`: Conflict (e.g., duplicate username)
- `500`: Internal server error

---

## Data Models

### Transaction Flags Example
```json
{
  "veryHighAmount": true,
  "unusualGeolocation": true,
  "suspiciousTimePattern": false,
  "multipleFailedAttempts": true
}
```

### Fraud Finding Evidence Example
```json
{
  "attempts": 5,
  "timeframe": "30 minutes",
  "ipAddresses": ["192.168.1.1", "10.0.0.1"],
  "accountsAffected": 3,
  "totalAmountAtRisk": 50000
}
```

---

## Development Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary amounts are returned as strings with 2 decimal places
- IDs are UUIDs unless otherwise specified (e.g., threat actor IDs follow naming convention)
- Pagination is 0-based offset
- In production, all endpoints should be protected with authentication middleware
- Currently using in-memory storage; migrate to PostgreSQL for production
