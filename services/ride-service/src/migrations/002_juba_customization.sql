-- ============================================
-- Wasil Ride Service - Juba Customization Migration
-- Version: 1.1.0
-- South Sudan Specific Fields
-- ============================================

-- ============================================
-- UPDATE RIDES TABLE
-- Add Juba-specific columns
-- ============================================

-- Update ride_type to include boda_boda
ALTER TABLE rides 
DROP CONSTRAINT IF EXISTS rides_ride_type_check;

ALTER TABLE rides 
ADD CONSTRAINT rides_ride_type_check 
CHECK (ride_type IN ('boda_boda', 'standard', 'premium'));

-- Add road condition column
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS road_condition VARCHAR(20) DEFAULT 'paved'
CHECK (road_condition IN ('paved', 'unpaved', 'rainy_season'));

-- Add seasonal multiplier column
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS seasonal_multiplier DECIMAL(3,2) DEFAULT 1.00;

-- Add night safety fee column
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS night_safety_fee DECIMAL(10,2) DEFAULT 0;

-- Add safety verified flag
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS safety_verified BOOLEAN DEFAULT FALSE;

-- Add payment method column
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash'
CHECK (payment_method IN ('cash', 'mtn_ss', 'zain_ss', 'card'));

-- Add payment status column
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));

-- Add zone information
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS pickup_zone VARCHAR(50);

ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS dropoff_zone VARCHAR(50);

-- ============================================
-- CREATE VEHICLES TABLE
-- South Sudan specific vehicle information
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    
    -- Vehicle identification
    license_plate_ss VARCHAR(20) NOT NULL,  -- South Sudan format
    vin VARCHAR(50),                         -- Vehicle Identification Number
    
    -- Vehicle details
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('boda_boda', 'standard', 'premium')),
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER,
    color VARCHAR(30),
    
    -- Capacity
    seats INTEGER DEFAULT 4,
    
    -- Documents & Verification
    registration_number VARCHAR(50),
    inspection_date DATE,
    inspection_expiry DATE,
    insurance_number VARCHAR(50),
    insurance_expiry DATE,
    
    -- Photos
    photo_front_url TEXT,
    photo_back_url TEXT,
    photo_side_url TEXT,
    photo_interior_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    verified_by INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vehicles table
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_license ON vehicles(license_plate_ss);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(is_active);

-- ============================================
-- UPDATE DRIVER_LOCATIONS TABLE
-- Add South Sudan specific fields
-- ============================================

-- Add preferred language
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en'
CHECK (preferred_language IN ('en', 'ar', 'din', 'nue', 'bri'));

-- Add vehicle type reference
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'standard'
CHECK (vehicle_type IN ('boda_boda', 'standard', 'premium'));

-- Add zone information
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS current_zone VARCHAR(50);

-- Add accepts mobile money flag
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS accepts_mobile_money BOOLEAN DEFAULT TRUE;

-- ============================================
-- CREATE DRIVER_VERIFICATION TABLE
-- South Sudan driver verification requirements
-- ============================================
CREATE TABLE IF NOT EXISTS driver_verification (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL UNIQUE,
    
    -- National ID (South Sudan)
    national_id_number VARCHAR(50),
    national_id_photo_url TEXT,
    national_id_verified BOOLEAN DEFAULT false,
    national_id_verified_at TIMESTAMP,
    
    -- Driving License
    license_number VARCHAR(50),
    license_class VARCHAR(20),
    license_photo_url TEXT,
    license_expiry DATE,
    license_verified BOOLEAN DEFAULT false,
    license_verified_at TIMESTAMP,
    
    -- Police Clearance
    police_clearance_number VARCHAR(50),
    police_clearance_date DATE,
    police_clearance_photo_url TEXT,
    police_clearance_verified BOOLEAN DEFAULT false,
    police_clearance_verified_at TIMESTAMP,
    
    -- Profile Photo
    profile_photo_url TEXT,
    profile_photo_verified BOOLEAN DEFAULT false,
    
    -- Overall verification
    overall_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (overall_status IN ('pending', 'in_review', 'approved', 'rejected', 'suspended')),
    approved_at TIMESTAMP,
    approved_by INTEGER,
    rejection_reason TEXT,
    
    -- Background check
    background_check_completed BOOLEAN DEFAULT false,
    background_check_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for driver_verification table
CREATE INDEX IF NOT EXISTS idx_driver_verification_driver_id ON driver_verification(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_verification_status ON driver_verification(overall_status);

-- ============================================
-- CREATE PAYMENTS TABLE
-- Track all payments including mobile money
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    rider_id INTEGER NOT NULL,
    driver_id INTEGER,
    
    -- Amount (in SSP)
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'SSP',
    usd_equivalent DECIMAL(10, 2),
    exchange_rate DECIMAL(10, 2),
    
    -- Payment details
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'mtn_ss', 'zain_ss', 'card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    -- Mobile money specific
    mobile_money_phone VARCHAR(20),
    mobile_money_reference VARCHAR(100),
    mobile_money_provider VARCHAR(20),
    
    -- Card payment specific
    card_last_four VARCHAR(4),
    card_type VARCHAR(20),
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(100),
    
    -- Cash payment specific
    cash_collected_by INTEGER,  -- Driver ID who collected cash
    cash_confirmed_at TIMESTAMP,
    
    -- Breakdown
    ride_fare DECIMAL(10, 2),
    booking_fee DECIMAL(10, 2),
    night_fee DECIMAL(10, 2),
    waiting_fee DECIMAL(10, 2),
    tip DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    
    -- Commission (Wasil takes 20%)
    commission_amount DECIMAL(10, 2),
    driver_payout DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    
    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT
);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_uuid ON payments(uuid);
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_rider_id ON payments(rider_id);
CREATE INDEX IF NOT EXISTS idx_payments_driver_id ON payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- ============================================
-- CREATE SAVED_PLACES TABLE
-- User saved locations (Home, Work, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_places (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    -- Place details
    name VARCHAR(100) NOT NULL,
    place_type VARCHAR(20) DEFAULT 'other' CHECK (place_type IN ('home', 'work', 'favorite', 'other')),
    
    -- Location
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    zone VARCHAR(50),
    
    -- Landmark reference (if applicable)
    landmark_id INTEGER,
    
    -- Order for display
    display_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for saved_places table
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_type ON saved_places(place_type);

-- ============================================
-- CREATE LANDMARKS TABLE
-- Popular locations in Juba
-- ============================================
CREATE TABLE IF NOT EXISTS landmarks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200),  -- Arabic name
    
    -- Location
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    zone VARCHAR(50),
    
    -- Category
    category VARCHAR(50) CHECK (category IN ('airport', 'hospital', 'market', 'university', 'government', 'hotel', 'restaurant', 'embassy', 'other')),
    
    -- Search keywords
    keywords TEXT[],
    
    -- Popularity (for sorting in search results)
    popularity_score INTEGER DEFAULT 0,
    search_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Juba landmarks
INSERT INTO landmarks (name, latitude, longitude, category, zone) VALUES
('Juba International Airport', 4.8720, 31.6011, 'airport', 'center'),
('Konyo Konyo Market', 4.8503, 31.5897, 'market', 'center'),
('Juba Teaching Hospital', 4.8441, 31.5819, 'hospital', 'center'),
('University of Juba', 4.8622, 31.5711, 'university', 'center'),
('Juba Stadium', 4.8492, 31.5994, 'other', 'center'),
('Custom Market', 4.8551, 31.5828, 'market', 'center'),
('Afex River Camp', 4.8694, 31.6125, 'hotel', 'outer'),
('Nyakuron Cultural Centre', 4.8581, 31.5906, 'other', 'center')
ON CONFLICT DO NOTHING;

-- Indexes for landmarks table
CREATE INDEX IF NOT EXISTS idx_landmarks_category ON landmarks(category);
CREATE INDEX IF NOT EXISTS idx_landmarks_zone ON landmarks(zone);
CREATE INDEX IF NOT EXISTS idx_landmarks_coords ON landmarks(latitude, longitude);

-- ============================================
-- CREATE EMERGENCY_CONTACTS TABLE
-- User emergency contacts for ride sharing
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    -- Contact details
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    
    -- Auto-share settings
    auto_share_rides BOOLEAN DEFAULT false,
    auto_share_night_rides BOOLEAN DEFAULT true,  -- Always share night rides
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    
    -- Order for display
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for emergency_contacts table
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- ============================================
-- CREATE SOS_ALERTS TABLE
-- Track emergency alerts during rides
-- ============================================
CREATE TABLE IF NOT EXISTS sos_alerts (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(id),
    user_id INTEGER NOT NULL,
    user_type VARCHAR(10) CHECK (user_type IN ('rider', 'driver')),
    
    -- Location at time of alert
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Alert details
    alert_type VARCHAR(50) DEFAULT 'emergency' CHECK (alert_type IN ('emergency', 'accident', 'harassment', 'vehicle_issue', 'other')),
    description TEXT,
    
    -- Response
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved', 'cancelled')),
    responded_at TIMESTAMP,
    responded_by INTEGER,  -- Admin/Support ID
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    
    -- Notifications sent
    police_notified BOOLEAN DEFAULT false,
    contacts_notified BOOLEAN DEFAULT false,
    admin_notified BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sos_alerts table
CREATE INDEX IF NOT EXISTS idx_sos_alerts_ride_id ON sos_alerts(ride_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at ON sos_alerts(created_at);

-- ============================================
-- CREATE DRIVER_EARNINGS TABLE
-- Track driver daily/weekly/monthly earnings
-- ============================================
CREATE TABLE IF NOT EXISTS driver_earnings (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL,
    
    -- Period
    period_type VARCHAR(10) CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Earnings (in SSP)
    total_rides INTEGER DEFAULT 0,
    total_distance DECIMAL(10, 2) DEFAULT 0,  -- in km
    total_fare DECIMAL(12, 2) DEFAULT 0,
    total_tips DECIMAL(10, 2) DEFAULT 0,
    total_commission DECIMAL(10, 2) DEFAULT 0,
    net_earnings DECIMAL(12, 2) DEFAULT 0,
    
    -- Payment breakdown
    cash_collected DECIMAL(12, 2) DEFAULT 0,
    mobile_money_received DECIMAL(12, 2) DEFAULT 0,
    card_received DECIMAL(12, 2) DEFAULT 0,
    
    -- Payout status
    payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
    payout_amount DECIMAL(12, 2),
    payout_method VARCHAR(20),
    payout_reference VARCHAR(100),
    payout_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(driver_id, period_type, period_start)
);

-- Indexes for driver_earnings table
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_period ON driver_earnings(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_payout_status ON driver_earnings(payout_status);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for vehicles table
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for driver_verification table
DROP TRIGGER IF EXISTS update_driver_verification_updated_at ON driver_verification;
CREATE TRIGGER update_driver_verification_updated_at
    BEFORE UPDATE ON driver_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for saved_places table
DROP TRIGGER IF EXISTS update_saved_places_updated_at ON saved_places;
CREATE TRIGGER update_saved_places_updated_at
    BEFORE UPDATE ON saved_places
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for landmarks table
DROP TRIGGER IF EXISTS update_landmarks_updated_at ON landmarks;
CREATE TRIGGER update_landmarks_updated_at
    BEFORE UPDATE ON landmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for emergency_contacts table
DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON emergency_contacts;
CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sos_alerts table
DROP TRIGGER IF EXISTS update_sos_alerts_updated_at ON sos_alerts;
CREATE TRIGGER update_sos_alerts_updated_at
    BEFORE UPDATE ON sos_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for driver_earnings table
DROP TRIGGER IF EXISTS update_driver_earnings_updated_at ON driver_earnings;
CREATE TRIGGER update_driver_earnings_updated_at
    BEFORE UPDATE ON driver_earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE vehicles IS 'South Sudan vehicle registration and verification';
COMMENT ON TABLE driver_verification IS 'Driver document verification for South Sudan requirements';
COMMENT ON TABLE payments IS 'Payment tracking including mobile money (MTN, Zain)';
COMMENT ON TABLE saved_places IS 'User saved locations for quick booking';
COMMENT ON TABLE landmarks IS 'Popular locations in Juba for destination search';
COMMENT ON TABLE emergency_contacts IS 'User emergency contacts for ride sharing feature';
COMMENT ON TABLE sos_alerts IS 'Emergency SOS alerts during rides';
COMMENT ON TABLE driver_earnings IS 'Driver earnings tracking and payout management';

COMMENT ON COLUMN rides.road_condition IS 'Road condition: paved, unpaved, or rainy_season';
COMMENT ON COLUMN rides.seasonal_multiplier IS 'Fare multiplier for rainy season (Apr-Oct)';
COMMENT ON COLUMN payments.currency IS 'SSP - South Sudanese Pound';
COMMENT ON COLUMN driver_verification.overall_status IS 'Driver verification status for South Sudan requirements';
