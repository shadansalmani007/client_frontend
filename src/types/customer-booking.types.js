/**
 * @typedef {Object} CustomerBookingSeat
 * @property {string} seatNumber
 * @property {string} passengerName
 * @property {number|string} passengerAge
 * @property {string} passengerGender
 */

/**
 * @typedef {Object} CustomerPayment
 * @property {string} [_id]
 * @property {string} [paymentId]
 * @property {string} [provider]
 * @property {string} [status]
 * @property {number} [amount]
 * @property {string} [currency]
 * @property {string} [reference]
 */

/**
 * @typedef {Object} CustomerSeatAvailability
 * @property {{ seats?: Array<object> }} [layout]
 * @property {Array<string|object>} [bookedSeats]
 * @property {Array<string|object>} [blockedSeats]
 * @property {Array<string|object>} [availableSeats]
 */

/**
 * @typedef {Object} CustomerBooking
 * @property {string} [_id]
 * @property {string} [bookingNumber]
 * @property {string} [scheduleId]
 * @property {string} [source]
 * @property {string} [destination]
 * @property {string} [travelDate]
 * @property {string} [departureTime]
 * @property {string} [arrivalTime]
 * @property {string} [bookingStatus]
 * @property {string} [paymentStatus]
 * @property {string} [paymentMethod]
 * @property {string} [contactEmail]
 * @property {string} [contactPhone]
 * @property {number} [amount]
 * @property {number} [totalAmount]
 * @property {string} [currency]
 * @property {Array<CustomerBookingSeat>} [seats]
 */

/**
 * @typedef {Object} CustomerBookingListItem
 * @property {CustomerBooking} booking
 * @property {"upcoming"|"past"|"cancelled"} category
 */

/**
 * @typedef {Object} CustomerBookingDetailsResponse
 * @property {CustomerBooking} booking
 * @property {Array<CustomerPayment>} payments
 * @property {CustomerSeatAvailability|null} seatAvailability
 * @property {{ canCancel?: boolean }} meta
 * @property {string} [message]
 */

/**
 * @typedef {Object} CustomerBookingListResponse
 * @property {Array<CustomerBooking>} bookings
 * @property {{ page?: number, limit?: number, total?: number, totalPages?: number }} pagination
 * @property {{ upcoming: Array<CustomerBooking>, past: Array<CustomerBooking>, cancelled: Array<CustomerBooking> }} categories
 * @property {string} [message]
 */

export const customerBookingTypes = Object.freeze({});
