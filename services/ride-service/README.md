# Wasil Ride Service

The core microservice for handling ride requests, driver matching, real-time tracking, and fare calculation in the Wasil ride-sharing platform.

## Features

- 🚗 **Ride Management** - Create, accept, start, complete, and cancel rides
- 🗺️ **Real-time Tracking** - Track driver location during rides via Socket.io
- 💰 **Fare Calculation** - Dynamic pricing with surge support
- 🔍 **Driver Matching** - Geospatial queries to find nearby drivers
- 📱 **Push Notifications** - RabbitMQ integration for notifications
- ⭐ **Rating System** - Rate rides after completion

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Databases**: PostgreSQL (main), MongoDB (tracking)
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Real-time**: Socket.io
- **Validation**: Joi

## Project Structure

```
services/ride-service/
├── src/
│   ├── index.js                    # Main entry point
│   ├── config/
│   │   ├── database.js             # PostgreSQL connection
│   │   ├── mongodb.js              # MongoDB connection
│   │   ├── redis.js                # Redis connection
│   │   └── socket.js               # Socket.io setup
│   ├── controllers/
│   │   ├── ride.controller.js      # Ride CRUD operations
│   │   └── tracking.controller.js  # Location tracking
│   ├── models/
│   │   ├── Ride.js                 # Ride model (PostgreSQL)
│   │   └── Location.js             # Location model (MongoDB)
│   ├── services/
│   │   ├── fareService.js          # Fare calculation
│   │   ├── matchingService.js      # Driver matching
│   │   ├── locationService.js      # Location tracking
│   │   └── notificationService.js  # Notifications
│   ├── routes/
│   │   ├── ride.routes.js          # Ride endpoints
│   │   └── tracking.routes.js      # Tracking endpoints
│   ├── middleware/
│   │   ├── authenticate.js         # JWT authentication
│   │   ├── authorize.js            # Role-based authorization
│   │   ├── validate.js             # Request validation
│   │   └── errorHandler.js         # Error handling
│   ├── utils/
│   │   ├── logger.js               # Winston logger
│   │   ├── distance.js             # Distance calculation
│   │   └── constants.js            # App constants
│   └── migrations/
│       └── 001_init.sql            # Database schema
├── package.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+
- RabbitMQ 3.12+

### Installation

1. **Clone the repository**
   ```bash
   cd services/ride-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   psql -U wasil -d wasil_rides -f src/migrations/001_init.sql
   ```

5. **Start the service**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Rides

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/rides` | Request a new ride | Rider |
| GET | `/api/v1/rides` | Get ride history | All |
| GET | `/api/v1/rides/:id` | Get ride details | Participants |
| POST | `/api/v1/rides/:id/accept` | Accept a ride | Driver |
| POST | `/api/v1/rides/:id/decline` | Decline a ride | Driver |
| POST | `/api/v1/rides/:id/arrive` | Mark arrived at pickup | Driver |
| POST | `/api/v1/rides/:id/start` | Start the ride | Driver |
| POST | `/api/v1/rides/:id/complete` | Complete the ride | Driver |
| POST | `/api/v1/rides/:id/cancel` | Cancel the ride | Participants |
| POST | `/api/v1/rides/:id/rate` | Rate the ride | Participants |
| POST | `/api/v1/rides/estimate` | Get fare estimate | All |
| GET | `/api/v1/rides/active/rider` | Get rider's active ride | Rider |
| GET | `/api/v1/rides/active/driver` | Get driver's active ride | Driver |

### Tracking

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| PUT | `/api/v1/drivers/location` | Update driver location | Driver |
| PUT | `/api/v1/drivers/availability` | Toggle availability | Driver |
| GET | `/api/v1/drivers/availability` | Get availability status | Driver |
| POST | `/api/v1/drivers/online` | Go online | Driver |
| POST | `/api/v1/drivers/offline` | Go offline | Driver |
| GET | `/api/v1/drivers/nearby` | Find nearby drivers | Admin |
| PUT | `/api/v1/rides/:id/location` | Update ride location | Driver |
| GET | `/api/v1/rides/:id/tracking` | Get ride tracking | Participants |
| GET | `/api/v1/rides/:id/eta` | Get ride ETA | Participants |

## Request/Response Examples

### Request a Ride

**Request:**
```json
POST /api/v1/rides
{
  "pickup": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St, New York, NY"
  },
  "dropoff": {
    "latitude": 40.7589,
    "longitude": -73.9851,
    "address": "456 Park Ave, New York, NY"
  },
  "rideType": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride requested successfully",
  "data": {
    "ride": {
      "id": 1,
      "uuid": "abc123...",
      "status": "requested",
      "pickup": {...},
      "dropoff": {...},
      "estimatedFare": 15.50,
      "estimatedDistance": 5.2
    },
    "fare": {
      "baseFare": 2.50,
      "distanceFare": 7.80,
      "timeFare": 3.75,
      "totalFare": 15.50
    },
    "driversNotified": 5
  }
}
```

## Socket.io Events

### Client → Server

| Event | Description | Payload |
|-------|-------------|---------|
| `join-ride` | Join a ride room | `rideId` |
| `leave-ride` | Leave a ride room | `rideId` |
| `driver-location-update` | Send location update | `{rideId, latitude, longitude, heading, speed}` |
| `toggle-availability` | Toggle availability | `isAvailable` |

### Server → Client

| Event | Description | Payload |
|-------|-------------|---------|
| `ride-requested` | New ride available | Ride details |
| `ride-accepted` | Ride accepted | Ride + Driver info |
| `ride-taken` | Ride taken by another | `{rideId}` |
| `driver-location` | Driver location update | Location data |
| `driver-arrived` | Driver at pickup | `{rideId}` |
| `ride-started` | Ride started | `{rideId}` |
| `ride-completed` | Ride completed | Fare details |
| `ride-cancelled` | Ride cancelled | Cancellation info |
| `eta-update` | ETA update | ETA data |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `RIDE_SERVICE_PORT` | HTTP port | 3002 |
| `POSTGRES_HOST` | PostgreSQL host | localhost |
| `POSTGRES_PORT` | PostgreSQL port | 5432 |
| `POSTGRES_DB` | Database name | wasil_rides |
| `MONGODB_URI` | MongoDB connection | mongodb://localhost:27017/wasil_tracking |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `RABBITMQ_URL` | RabbitMQ URL | amqp://localhost:5672 |
| `JWT_SECRET` | JWT secret key | - |
| `MAX_DRIVER_SEARCH_RADIUS` | Search radius (miles) | 5 |
| `BASE_FARE` | Base fare ($) | 2.50 |
| `COST_PER_MILE` | Cost per mile ($) | 1.50 |
| `COST_PER_MINUTE` | Cost per minute ($) | 0.25 |

## Ride Status Flow

```
requested → accepted → arriving → in_progress → completed
    ↓          ↓          ↓            ↓
  cancelled  cancelled  cancelled   cancelled
```

## Fare Calculation

```javascript
totalFare = (baseFare + (distance * costPerMile) + (duration * costPerMinute)) * surgeMultiplier
totalFare = Math.max(totalFare, minimumFare)
```

**Default Pricing:**
- Base Fare: $2.50
- Per Mile: $1.50
- Per Minute: $0.25
- Minimum Fare: $5.00

**Ride Type Multipliers:**
- Standard: 1.0x
- Premium: 1.5x
- XL: 1.3x

## Development

### Run Tests
```bash
npm test
```

### Run Linting
```bash
npm run lint
```

### Start with Hot Reload
```bash
npm run dev
```

## Health Checks

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed check with dependencies

## License

MIT
