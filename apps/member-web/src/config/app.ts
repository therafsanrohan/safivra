/**
 * Central application configuration.
 * Change these values here to update them everywhere in the app.
 */
export const APP_CONFIG = {
  name: 'Safivra',
  version: '1.0.0',
  description: 'Personal financial management',

  // Regional settings
  currency: {
    code: 'BDT',
    symbol: '৳',
    locale: 'en-BD',
  },
  timezone: 'Asia/Dhaka',
  locale: 'en-BD',
  dateFormat: 'dd MMM yyyy',      // 29 Jul 2026
  fullDateFormat: 'dd MMMM yyyy', // 29 July 2026
  timeFormat: 'hh:mm a',         // 10:23 AM

  // Financial precision
  decimalPlaces: 2,

  // Pagination
  transactionsPerPage: 30,
  notificationsPerPage: 20,

  // File upload limits (bytes)
  maxAttachmentSize: 5 * 1024 * 1024, // 5 MB
  allowedAttachmentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],

  // Storage bucket
  attachmentsBucket: 'attachments',

  // Support
  supportEmail: 'support@safivra.com',
} as const;

export type AppConfig = typeof APP_CONFIG;
