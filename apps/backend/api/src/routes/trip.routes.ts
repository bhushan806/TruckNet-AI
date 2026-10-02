// ── Trip Routes ──
// Lifecycle, contact, chat, and anti-overlap booking endpoints.

import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as tripController from '../controllers/trip.controller';

const router = Router();

// All trip routes require authentication
router.use(protect);

// ── Query & Booking ──
router.get('/', tripController.getMyTrips);                                // GET  /api/trips — list trips (owner, driver, customer)
router.post('/book', tripController.bookTrip);                             // POST /api/trips/book — book match with anti-overlap lock
router.get('/by-load/:identifier', tripController.getTripByLoad);          // GET  /api/trips/by-load/:identifier — trip by loadId/loadNumber/trx

// ── Single Trip Details, Contact & Chat ──
router.get('/:tripId', tripController.getTripById);                        // GET  /api/trips/:tripId — trip detail
router.get('/:tripId/contact', tripController.getTripContactInfo);          // GET  /api/trips/:tripId/contact — verified contact cards
router.get('/:tripId/messages', tripController.getTripMessages);           // GET  /api/trips/:tripId/messages — chat history
router.post('/:tripId/messages', tripController.sendTripMessage);          // POST /api/trips/:tripId/messages — send real-time message

// ── Statutory Transportation Documents (Bilty, Transit Pass, POD) ──
router.get('/:tripId/documents', tripController.getTripDocuments);          // GET  /api/trips/:tripId/documents — list Bilty & docs
router.get('/:tripId/documents/:docId', tripController.getTripDocumentById);// GET  /api/trips/:tripId/documents/:docId — single doc detail
router.get('/by-load/:identifier/documents', tripController.getDocumentsByLoad); // GET /api/trips/by-load/:identifier/documents

// ── Lifecycle transitions ──
router.patch('/:tripId/pickup', tripController.confirmPickup);             // PATCH /api/trips/:tripId/pickup — driver confirms pickup
router.patch('/:tripId/transit', tripController.startTransit);             // PATCH /api/trips/:tripId/transit — driver starts transit
router.patch('/:tripId/deliver', tripController.confirmDelivery);          // PATCH /api/trips/:tripId/deliver — driver confirms delivery
router.patch('/:tripId/complete', tripController.completeTrip);            // PATCH /api/trips/:tripId/complete — owner completes trip

export default router;
