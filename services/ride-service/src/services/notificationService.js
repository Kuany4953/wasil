/**
 * Notification Service
 * 
 * Handles sending notifications via RabbitMQ message queue
 * and Socket.io for real-time updates.
 * 
 * @module services/notificationService
 */

const amqp = require('amqplib');
const socketService = require('../config/socket');
const logger = require('../utils/logger');
const { QUEUES, EXCHANGES } = require('../utils/constants');

// RabbitMQ connection
let connection = null;
let channel = null;

class NotificationService {
  /**
   * Initialize RabbitMQ connection and channel
   * 
   * @returns {Promise<boolean>} True if connection successful
   */
  static async initialize() {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      connection = await amqp.connect(rabbitUrl);
      channel = await connection.createChannel();

      // Set up exchanges
      await channel.assertExchange(EXCHANGES.RIDES, 'topic', { durable: true });
      await channel.assertExchange(EXCHANGES.NOTIFICATIONS, 'direct', { durable: true });

      // Set up queues
      await this.setupQueues();

      logger.info('RabbitMQ notification service initialized');
      
      // Handle connection events
      connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err.message });
      });

      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        // Attempt reconnection
        setTimeout(() => this.initialize(), 5000);
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize RabbitMQ', { error: error.message });
      return false;
    }
  }

  /**
   * Set up required queues
   */
  static async setupQueues() {
    const queues = [
      QUEUES.RIDE_REQUESTED,
      QUEUES.RIDE_ACCEPTED,
      QUEUES.RIDE_COMPLETED,
      QUEUES.RIDE_CANCELLED,
      QUEUES.NOTIFICATION_PUSH,
      QUEUES.NOTIFICATION_SMS,
      QUEUES.NOTIFICATION_EMAIL
    ];

    for (const queue of queues) {
      await channel.assertQueue(queue, { durable: true });
    }

    // Bind ride queues to exchange
    await channel.bindQueue(QUEUES.RIDE_REQUESTED, EXCHANGES.RIDES, 'ride.requested');
    await channel.bindQueue(QUEUES.RIDE_ACCEPTED, EXCHANGES.RIDES, 'ride.accepted');
    await channel.bindQueue(QUEUES.RIDE_COMPLETED, EXCHANGES.RIDES, 'ride.completed');
    await channel.bindQueue(QUEUES.RIDE_CANCELLED, EXCHANGES.RIDES, 'ride.cancelled');
  }

  /**
   * Close RabbitMQ connection
   */
  static async close() {
    try {
      if (channel) {
        await channel.close();
      }
      if (connection) {
        await connection.close();
      }
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error: error.message });
    }
  }

  /**
   * Publish message to a queue
   * 
   * @param {string} queue - Queue name
   * @param {Object} message - Message to send
   * @returns {boolean} True if message was sent
   */
  static async publishToQueue(queue, message) {
    if (!channel) {
      logger.warn('RabbitMQ channel not initialized, message not sent');
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));

      channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        contentType: 'application/json'
      });

      logger.debug('Message published to queue', { queue, type: message.type });
      return true;
    } catch (error) {
      logger.error('Error publishing to queue', { queue, error: error.message });
      return false;
    }
  }

  /**
   * Publish message to an exchange
   * 
   * @param {string} exchange - Exchange name
   * @param {string} routingKey - Routing key
   * @param {Object} message - Message to send
   * @returns {boolean} True if message was sent
   */
  static async publishToExchange(exchange, routingKey, message) {
    if (!channel) {
      logger.warn('RabbitMQ channel not initialized, message not sent');
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));

      channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json'
      });

      logger.debug('Message published to exchange', { exchange, routingKey, type: message.type });
      return true;
    } catch (error) {
      logger.error('Error publishing to exchange', { exchange, routingKey, error: error.message });
      return false;
    }
  }

  // ==========================================
  // RIDE NOTIFICATIONS
  // ==========================================

  /**
   * Notify drivers about a new ride request
   * 
   * @param {Array} drivers - List of drivers to notify
   * @param {Object} ride - Ride details
   */
  static async notifyDriversOfNewRide(drivers, ride) {
    logger.info('Notifying drivers of new ride', { rideId: ride.id, driverCount: drivers.length });

    // Publish to message queue
    await this.publishToExchange(EXCHANGES.RIDES, 'ride.requested', {
      type: 'ride.requested',
      data: {
        rideId: ride.id,
        riderId: ride.riderId,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        rideType: ride.rideType,
        estimatedFare: ride.estimatedFare,
        estimatedDistance: ride.estimatedDistance,
        driverIds: drivers.map(d => d.driverId)
      }
    });

    // Send real-time notification to each driver via Socket.io
    for (const driver of drivers) {
      socketService.emitToDriver(driver.driverId, socketService.SOCKET_EVENTS.RIDE_REQUESTED, {
        rideId: ride.id,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        rideType: ride.rideType,
        estimatedFare: ride.estimatedFare,
        estimatedDistance: ride.estimatedDistance,
        distanceToPickup: driver.distanceToPickup,
        etaToPickup: driver.etaSeconds
      });
    }
  }

  /**
   * Notify rider that ride was accepted
   * 
   * @param {Object} ride - Ride details
   * @param {Object} driver - Driver details
   */
  static async notifyRiderOfAcceptance(ride, driver) {
    logger.info('Notifying rider of ride acceptance', { rideId: ride.id, riderId: ride.riderId });

    // Publish to message queue
    await this.publishToExchange(EXCHANGES.RIDES, 'ride.accepted', {
      type: 'ride.accepted',
      data: {
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        driverInfo: driver
      }
    });

    // Real-time notification to rider
    socketService.emitToRider(ride.riderId, socketService.SOCKET_EVENTS.RIDE_ACCEPTED, {
      rideId: ride.id,
      driver: driver,
      message: 'Your driver is on the way!'
    });
  }

  /**
   * Notify other drivers that ride was taken
   * 
   * @param {number} rideId - Ride ID
   * @param {Array} driverIds - Driver IDs to notify
   * @param {number} acceptedDriverId - ID of driver who accepted
   */
  static async notifyDriversRideTaken(rideId, driverIds, acceptedDriverId) {
    logger.info('Notifying drivers that ride was taken', { rideId, driverCount: driverIds.length });

    for (const driverId of driverIds) {
      if (driverId !== acceptedDriverId) {
        socketService.emitToDriver(driverId, socketService.SOCKET_EVENTS.RIDE_TAKEN, {
          rideId,
          message: 'This ride has been accepted by another driver'
        });
      }
    }
  }

  /**
   * Notify rider that driver has arrived
   * 
   * @param {Object} ride - Ride details
   */
  static async notifyRiderDriverArrived(ride) {
    logger.info('Notifying rider that driver arrived', { rideId: ride.id, riderId: ride.riderId });

    socketService.emitToRider(ride.riderId, socketService.SOCKET_EVENTS.DRIVER_ARRIVED, {
      rideId: ride.id,
      message: 'Your driver has arrived!'
    });

    // Send push notification
    await this.sendPushNotification(ride.riderId, {
      title: 'Driver Arrived',
      body: 'Your driver has arrived at the pickup location',
      data: { rideId: ride.id }
    });
  }

  /**
   * Notify parties that ride has started
   * 
   * @param {Object} ride - Ride details
   */
  static async notifyRideStarted(ride) {
    logger.info('Notifying ride started', { rideId: ride.id });

    socketService.emitToRide(ride.id, socketService.SOCKET_EVENTS.RIDE_STARTED, {
      rideId: ride.id,
      startedAt: new Date().toISOString(),
      message: 'Ride has started'
    });
  }

  /**
   * Notify parties that ride is complete
   * 
   * @param {Object} ride - Ride details with fare
   */
  static async notifyRideCompleted(ride) {
    logger.info('Notifying ride completed', { rideId: ride.id });

    // Publish to message queue
    await this.publishToExchange(EXCHANGES.RIDES, 'ride.completed', {
      type: 'ride.completed',
      data: {
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        actualFare: ride.actualFare,
        actualDistance: ride.actualDistance,
        actualDuration: ride.actualDuration
      }
    });

    // Real-time notification
    socketService.emitToRide(ride.id, socketService.SOCKET_EVENTS.RIDE_COMPLETED, {
      rideId: ride.id,
      fare: ride.actualFare,
      distance: ride.actualDistance,
      duration: ride.actualDuration,
      message: 'Ride completed successfully'
    });

    // Send push notification to rider
    await this.sendPushNotification(ride.riderId, {
      title: 'Ride Completed',
      body: `Your ride is complete. Total fare: $${ride.actualFare.toFixed(2)}`,
      data: { rideId: ride.id }
    });
  }

  /**
   * Notify parties that ride was cancelled
   * 
   * @param {Object} ride - Ride details
   * @param {string} cancelledBy - Who cancelled
   * @param {string} reason - Cancellation reason
   */
  static async notifyRideCancelled(ride, cancelledBy, reason) {
    logger.info('Notifying ride cancelled', { rideId: ride.id, cancelledBy });

    // Publish to message queue
    await this.publishToExchange(EXCHANGES.RIDES, 'ride.cancelled', {
      type: 'ride.cancelled',
      data: {
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        cancelledBy,
        reason
      }
    });

    // Real-time notification
    socketService.emitToRide(ride.id, socketService.SOCKET_EVENTS.RIDE_CANCELLED, {
      rideId: ride.id,
      cancelledBy,
      reason,
      message: `Ride cancelled by ${cancelledBy}`
    });

    // Notify the other party
    if (cancelledBy === 'rider' && ride.driverId) {
      await this.sendPushNotification(ride.driverId, {
        title: 'Ride Cancelled',
        body: 'The rider has cancelled this ride',
        data: { rideId: ride.id }
      });
    } else if (cancelledBy === 'driver') {
      await this.sendPushNotification(ride.riderId, {
        title: 'Ride Cancelled',
        body: 'Your driver has cancelled. We\'re finding you a new driver.',
        data: { rideId: ride.id }
      });
    }
  }

  /**
   * Send ETA update to rider
   * 
   * @param {Object} ride - Ride details
   * @param {Object} eta - ETA information
   */
  static async sendETAUpdate(ride, eta) {
    socketService.emitToRider(ride.riderId, socketService.SOCKET_EVENTS.ETA_UPDATE, {
      rideId: ride.id,
      eta: eta.etaSeconds,
      formattedETA: eta.formattedETA,
      distanceRemaining: eta.distanceRemaining
    });
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Send push notification
   * 
   * @param {number} userId - User ID
   * @param {Object} notification - Notification details
   */
  static async sendPushNotification(userId, notification) {
    await this.publishToQueue(QUEUES.NOTIFICATION_PUSH, {
      type: 'push',
      userId,
      notification
    });
    
    logger.debug('Push notification queued', { userId, title: notification.title });
  }

  /**
   * Send SMS notification
   * 
   * @param {string} phoneNumber - Phone number
   * @param {string} message - SMS message
   */
  static async sendSMS(phoneNumber, message) {
    await this.publishToQueue(QUEUES.NOTIFICATION_SMS, {
      type: 'sms',
      phoneNumber,
      message
    });
    
    logger.debug('SMS notification queued', { phoneNumber: phoneNumber.substring(0, 4) + '****' });
  }

  /**
   * Send email notification
   * 
   * @param {string} email - Email address
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   */
  static async sendEmail(email, subject, body) {
    await this.publishToQueue(QUEUES.NOTIFICATION_EMAIL, {
      type: 'email',
      email,
      subject,
      body
    });
    
    logger.debug('Email notification queued', { email: email.substring(0, 3) + '***' });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if RabbitMQ is connected
   * 
   * @returns {boolean} Connection status
   */
  static isConnected() {
    return connection !== null && channel !== null;
  }

  /**
   * Get connection status
   * 
   * @returns {Object} Status information
   */
  static getStatus() {
    return {
      connected: this.isConnected(),
      connection: connection ? 'established' : 'not connected',
      channel: channel ? 'open' : 'not open'
    };
  }
}

module.exports = NotificationService;
