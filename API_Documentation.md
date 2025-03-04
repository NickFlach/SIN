# SINet Dashboard: API Documentation

## Overview

The SINet Dashboard provides a comprehensive API for interacting with the system programmatically. This document details all available endpoints, request/response formats, and integration patterns.

## Base URL

All API endpoints are relative to the base URL of your SINet Dashboard installation.

Example: `https://sinet-dashboard.example.com`

## Authentication

API requests require authentication using developer keys. Include the key in the request header:

```
Authorization: Bearer YOUR_DEVELOPER_KEY
```

Developer keys can be obtained through the Applications page in the SINet Dashboard interface.

## REST Endpoints

### Node Management

#### Get All Nodes

Retrieves a list of all compute nodes in the SINet network.

- **URL**: `/api/nodes`
- **Method**: `GET`
- **Response**: Array of node objects
  ```json
  [
    {
      "id": 1,
      "name": "Tokyo-Node-01",
      "status": "active",
      "location": {
        "lat": 35.6895,
        "lng": 139.6917,
        "region": "Asia-Northeast"
      },
      "performance": 95,
      "lastSeen": "2025-03-01T14:28:43.511Z"
    },
    {...}
  ]
  ```

### AI Model Management

#### Get All Models

Retrieves information about all AI models in the system.

- **URL**: `/api/models`
- **Method**: `GET`
- **Response**: Array of model objects
  ```json
  [
    {
      "id": 1,
      "name": "CLIP",
      "version": "2.1",
      "status": "training",
      "progress": 78,
      "accuracy": 92.0,
      "created": "2025-02-15T09:34:23.511Z",
      "updated": "2025-03-01T14:28:43.511Z"
    },
    {...}
  ]
  ```

### SCADA Integration

#### Get Devices

Retrieves information about all connected SCADA devices.

- **URL**: `/api/devices`
- **Method**: `GET`
- **Response**: Array of device objects
  ```json
  [
    {
      "id": 1,
      "name": "Rockwell Automation-ControlLogix 1756",
      "type": "PLC",
      "status": "online",
      "readings": {
        "temperature": 24.5,
        "pressure": 2.3
      },
      "lastUpdated": "2025-03-01T14:28:43.511Z"
    },
    {...}
  ]
  ```

### Governance

#### Get Proposals

Retrieves all governance proposals in the system.

- **URL**: `/api/proposals`
- **Method**: `GET`
- **Response**: Array of proposal objects
  ```json
  [
    {
      "id": 1,
      "title": "Increase Northeast Asia Node Capacity",
      "description": "Proposal to add 10 new compute nodes to the Northeast Asia region",
      "status": "voting",
      "votes": {
        "yes": 245,
        "no": 23,
        "abstain": 12
      },
      "created": "2025-02-20T09:34:23.511Z",
      "expires": "2025-03-05T09:34:23.511Z"
    },
    {...}
  ]
  ```

### Application Management

#### Get Applications

Retrieves all registered applications.

- **URL**: `/api/applications`
- **Method**: `GET`
- **Response**: Array of application objects
  ```json
  [
    {
      "id": 1,
      "name": "Resource Optimizer",
      "type": "service",
      "version": "1.2.0",
      "status": "active",
      "location": {
        "lat": 37.7749,
        "lng": -122.4194,
        "region": "US-West"
      },
      "metrics": {
        "cpu": 45.2,
        "memory": 62.8,
        "requestsPerSecond": 2341,
        "maxRequests": 10000,
        "uptime": 86400
      },
      "lastUpdated": "2025-03-01T14:28:43.511Z"
    },
    {...}
  ]
  ```

#### Create Application

Registers a new application in the system.

- **URL**: `/api/applications`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "Data Analyzer",
    "type": "service",
    "version": "1.0.0"
  }
  ```
- **Response**: The created application object
  ```json
  {
    "id": 5,
    "name": "Data Analyzer",
    "type": "service",
    "version": "1.0.0",
    "status": "active",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "region": "US-East"
    },
    "metrics": {
      "cpu": 0,
      "memory": 0,
      "requestsPerSecond": 0,
      "maxRequests": 10000,
      "uptime": 0
    },
    "lastUpdated": "2025-03-01T15:01:23.511Z"
  }
  ```

#### Get Application Integrations

Retrieves all integrations for a specific application.

- **URL**: `/api/applications/:id/integrations`
- **Method**: `GET`
- **Parameters**:
  - `id`: Application ID
- **Response**: Array of integration objects
  ```json
  [
    {
      "id": 1,
      "appId": 1,
      "name": "Weather Service",
      "type": "api",
      "status": "active",
      "config": {
        "url": "https://api.weather.com/forecast",
        "method": "GET",
        "baseUrl": "https://api.weather.com"
      },
      "metrics": {
        "latency": 120,
        "successRate": 99.8,
        "requestCount": 15243
      }
    },
    {...}
  ]
  ```

#### Create Application Integration

Adds a new integration to an application.

- **URL**: `/api/applications/:id/integrations`
- **Method**: `POST`
- **Parameters**:
  - `id`: Application ID
- **Request Body**:
  ```json
  {
    "name": "Payment Processor",
    "type": "api",
    "config": {
      "url": "https://api.payments.com/process",
      "method": "POST",
      "baseUrl": "https://api.payments.com"
    }
  }
  ```
- **Response**: The created integration object
  ```json
  {
    "id": 3,
    "appId": 1,
    "name": "Payment Processor",
    "type": "api",
    "status": "active",
    "config": {
      "url": "https://api.payments.com/process",
      "method": "POST",
      "baseUrl": "https://api.payments.com"
    },
    "metrics": {
      "latency": 0,
      "successRate": 100,
      "requestCount": 0
    }
  }
  ```

#### Get Application Developer Keys

Retrieves all developer keys for a specific application.

- **URL**: `/api/applications/:id/developer-keys`
- **Method**: `GET`
- **Parameters**:
  - `id`: Application ID
- **Response**: Array of developer key objects
  ```json
  [
    {
      "id": 1,
      "key": "sinet_dev_a1b2c3d4e5f6",
      "name": "Production API Key",
      "created": "2025-02-01T09:34:23.511Z",
      "lastUsed": "2025-03-01T14:28:43.511Z",
      "permissions": ["read", "write"]
    },
    {...}
  ]
  ```

### API Discovery

#### Discover Endpoints

Analyzes an external API to discover available endpoints.

- **URL**: `/api/discover-endpoints`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "url": "https://api.example.com"
  }
  ```
- **Response**: API discovery results
  ```json
  {
    "baseUrl": "https://api.example.com",
    "available": true,
    "detectedEndpoints": [
      {
        "path": "/users",
        "method": "GET",
        "sampleResponse": {"users": [{"id": 1, "name": "Example User"}]}
      },
      {
        "path": "/products",
        "method": "GET",
        "sampleResponse": {"products": [{"id": 101, "name": "Sample Product"}]}
      }
    ]
  }
  ```

### Music Portal

#### Get Recent Songs

Retrieves a list of recently added songs from the music portal.

- **URL**: `/api/music-portal/recent-songs`
- **Method**: `GET`
- **Response**: Array of song objects
  ```json
  [
    {
      "id": "70",
      "title": "Pour it On",
      "artist": "Flaukowski",
      "addedAt": "2025-02-13T00:04:11.038Z"
    },
    {...}
  ]
  ```

#### Stream Song

Streams the audio content of a specific song.

- **URL**: `/api/music-portal/stream/:id`
- **Method**: `GET`
- **Parameters**:
  - `id`: Song ID
- **Response**: Audio file stream (MP3 format)

#### Get Song Artwork

Retrieves the artwork image for a specific song.

- **URL**: `/api/music-portal/artwork/:id`
- **Method**: `GET`
- **Parameters**:
  - `id`: Song ID
- **Response**: Image file (JPG/PNG format)

### System Integrator

#### Get System Integrator Status

Retrieves the status of the System Integrator Network.

- **URL**: `/api/system-integrator/status`
- **Method**: `GET`
- **Response**: System status object
  ```json
  {
    "nodes": [
      {
        "id": "node1",
        "name": "Primary Integration Node",
        "status": "active",
        "lastSync": "2025-03-01T14:28:43.511Z",
        "metrics": {
          "throughput": 876,
          "latency": 34,
          "errorRate": 0.02
        }
      },
      {...}
    ],
    "systemStatus": "operational"
  }
  ```

## WebSocket API

The SINet Dashboard provides real-time updates via WebSocket connections.

### Connection

Connect to the WebSocket endpoint:

```
ws://your-dashboard-url/ws
```

### Message Format

All messages follow this format:

```json
{
  "type": "event_type",
  "data": {
    // Event specific data
  }
}
```

### Event Types

#### `node_update`

Sent when a node's status or performance changes.

```json
{
  "type": "node_update",
  "data": {
    "id": 1,
    "performance": 92
  }
}
```

#### `model_update`

Sent when an AI model's training progress changes.

```json
{
  "type": "model_update",
  "data": {
    "id": 1,
    "progress": 80
  }
}
```

#### `device_update`

Sent when a SCADA device reports new readings.

```json
{
  "type": "device_update",
  "data": {
    "id": 1,
    "readings": {
      "temperature": 25.3,
      "pressure": 2.1
    }
  }
}
```

#### `app_update`

Sent when an application's metrics change.

```json
{
  "type": "app_update",
  "data": {
    "id": 1,
    "metrics": {
      "cpu": 48.2,
      "memory": 62.1,
      "requestsPerSecond": 2567,
      "maxRequests": 10000,
      "uptime": 86405
    },
    "lastUpdated": "2025-03-01T14:28:48.511Z"
  }
}
```

#### `integration_update`

Sent when an integration's metrics change.

```json
{
  "type": "integration_update",
  "data": {
    "id": 1,
    "metrics": {
      "latency": 115,
      "successRate": 99.9,
      "requestCount": 15255
    }
  }
}
```

## Error Handling

All API endpoints return standard HTTP status codes:

- `200 OK`: The request succeeded.
- `201 Created`: A new resource was created.
- `400 Bad Request`: The request was malformed.
- `401 Unauthorized`: Authentication is required or failed.
- `403 Forbidden`: The authenticated user lacks sufficient permissions.
- `404 Not Found`: The requested resource was not found.
- `500 Internal Server Error`: An unexpected server error occurred.

Error responses include a JSON object with error details:

```json
{
  "error": "Error message",
  "message": "Human-readable explanation"
}
```

## Rate Limiting

API requests are subject to rate limiting. The current limits are:

- 100 requests per minute per IP address
- 1,000 requests per hour per developer key

When rate limits are exceeded, endpoints return a `429 Too Many Requests` status code with a `Retry-After` header indicating when to retry.

## Versioning

API versioning is managed through the URL path:

- Current version (unspecified): `/api/...`
- Explicit version: `/api/v1/...`

## Webhooks

Applications can register webhooks to receive notifications about events:

- **URL**: `/api/applications/:id/webhooks`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "url": "https://your-app.example.com/webhook",
    "events": ["node_update", "model_update"],
    "secret": "your_webhook_secret"
  }
  ```
- **Response**: The created webhook object
  ```json
  {
    "id": 1,
    "url": "https://your-app.example.com/webhook",
    "events": ["node_update", "model_update"],
    "status": "active",
    "created": "2025-03-01T15:01:23.511Z"
  }
  ```

Webhook payloads match the WebSocket event format, with an additional `timestamp` field.

## SDK Support

Official client libraries are available for:

- JavaScript/TypeScript
- Python
- Go
- Java

These SDKs provide convenient wrappers around the REST and WebSocket APIs, handling authentication, serialization, and error management.
