-- ============================================
-- Wasil Ride Service - Database Schema
-- Version: 1.0.0
-- ============================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RIDES TABLE
-- Stores all ride information
-- ============================================
CREATE TABLE IF NOT EXISTS rides (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    rider_id INTEGER NOT NULL,
    driver_id INTEGER,
    
    -- Pickup Location
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT NOT NULL,
    
    -- Dropoff Location
    dropoff_latitude DECIMAL(10, 8) NOT NULL,
    dropoff_longitude DECIMAL(11, 8) NOT NULL,
    dropoff_address TEXT NOT NULL,
    
    -- Ride Details
    ride_type VARCHAR(20) DEFAULT 'standard' CHECK (ride_type IN ('standard', 'premium', 'xl')),
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
    
    -- Pricing
    estimated_fare DECIMAL(10, 2),
    actual_fare DECIMAL(10, 2),
    base_fare DECIMAL(10, 2),
    distance_fare DECIMAL(10, 2),
    time_fare DECIMAL(10, 2),
    surge_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    
    -- Distance & Duration Metrics
    estimated_distance DECIMAL(10, 2),  -- in miles
    actual_distance DECIMAL(10, 2),
    estimated_duration INTEGER,          -- in seconds
    actual_duration INTEGER,
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    arrived_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('rider', 'driver', 'system')),
    
    -- Ratings & Feedback
    rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    rider_feedback TEXT,
    driver_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rides table
CREATE INDEX IF NOT EXISTS idx_rides_uuid ON rides(uuid);
CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at);
CREATE INDEX IF NOT EXISTS idx_rides_requested_at ON rides(requested_at);
CREATE INDEX IF NOT EXISTS idx_rides_rider_status ON rides(rider_id, status);
CREATE INDEX IF NOT EXISTS idx_rides_driver_status ON rides(driver_id, status);

-- ============================================
-- DRIVER_LOCATIONS TABLE
-- Stores real-time driver location data
-- ============================================
CREATE TABLE IF NOT EXISTS driver_locations (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL UNIQUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    heading INTEGER CHECK (heading >= 0 AND heading <= 359),  -- Direction in degrees
    speed DECIMAL(5, 2),                                       -- Speed in mph
    is_available BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT true,
    current_ride_id INTEGER REFERENCES rides(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for driver_locations table
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_available ON driver_locations(is_available);
CREATE INDEX IF NOT EXISTS idx_driver_locations_online ON driver_locations(is_online);
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON driver_locations(updated_at);
-- Geospatial index for finding nearby drivers
CREATE INDEX IF NOT EXISTS idx_driver_locations_coords ON driver_locations(latitude, longitude);

-- ============================================
-- RIDE_REQUESTS TABLE
-- Tracks which drivers were notified for a ride
-- ============================================
CREATE TABLE IF NOT EXISTS ride_requests (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    driver_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'taken')),
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    distance_to_pickup DECIMAL(10, 2),  -- Distance from driver to pickup in miles
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ride_requests table
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_id ON ride_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver_id ON ride_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);

-- ============================================
-- RIDE_WAYPOINTS TABLE
-- Stores location history during active rides
-- ============================================
CREATE TABLE IF NOT EXISTS ride_waypoints (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    heading INTEGER,
    speed DECIMAL(5, 2),
    source VARCHAR(20) CHECK (source IN ('driver', 'rider')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ride_waypoints table
CREATE INDEX IF NOT EXISTS idx_ride_waypoints_ride_id ON ride_waypoints(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_waypoints_recorded_at ON ride_waypoints(recorded_at);

-- ============================================
-- SURGE_PRICING TABLE
-- Stores surge pricing zones
-- ============================================
CREATE TABLE IF NOT EXISTS surge_pricing (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    center_latitude DECIMAL(10, 8) NOT NULL,
    center_longitude DECIMAL(11, 8) NOT NULL,
    radius_miles DECIMAL(5, 2) NOT NULL,
    surge_multiplier DECIMAL(3, 2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for surge_pricing table
CREATE INDEX IF NOT EXISTS idx_surge_pricing_active ON surge_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_surge_pricing_coords ON surge_pricing(center_latitude, center_longitude);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for rides table
DROP TRIGGER IF EXISTS update_rides_updated_at ON rides;
CREATE TRIGGER update_rides_updated_at
    BEFORE UPDATE ON rides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for driver_locations table
DROP TRIGGER IF EXISTS update_driver_locations_updated_at ON driver_locations;
CREATE TRIGGER update_driver_locations_updated_at
    BEFORE UPDATE ON driver_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for surge_pricing table
DROP TRIGGER IF EXISTS update_surge_pricing_updated_at ON surge_pricing;
CREATE TRIGGER update_surge_pricing_updated_at
    BEFORE UPDATE ON surge_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE rides IS 'Main table storing all ride information';
COMMENT ON TABLE driver_locations IS 'Real-time driver location tracking';
COMMENT ON TABLE ride_requests IS 'Tracks ride notifications sent to drivers';
COMMENT ON TABLE ride_waypoints IS 'Location history during active rides';
COMMENT ON TABLE surge_pricing IS 'Dynamic pricing zones configuration';

COMMENT ON COLUMN rides.status IS 'Ride status: requested -> accepted -> arriving -> in_progress -> completed/cancelled';
COMMENT ON COLUMN rides.ride_type IS 'Type of ride: standard, premium, or xl';
COMMENT ON COLUMN rides.surge_multiplier IS 'Multiplier applied to fare during high demand';
COMMENT ON COLUMN driver_locations.heading IS 'Direction of travel in degrees (0-359)';
COMMENT ON COLUMN driver_locations.is_available IS 'Whether driver is available for new rides';
