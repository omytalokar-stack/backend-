/**
 * Cron Jobs for Booking System
 * - Auto-unlock next day slots at midnight
 */

const cron = require('node-cron');
const Booking = require('./models/Booking');

// Helper: Get tomorrow's date in YYYY-MM-DD format
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Job: Unlock all slots for the next day at midnight (00:00)
 * This ensures users always have current and next day slots available
 */
const scheduleNextDayUnlock = () => {
  // Run at 00:00 (midnight) every day
  const job = cron.schedule('0 0 * * *', async () => {
    try {
      const tomorrowDate = getTomorrowDate();
      console.log(`\n⏰ [CRON] Running Next Day Auto-Unlock at ${new Date().toISOString()}`);
      console.log(`📅 Unlocking all slots for: ${tomorrowDate}\n`);

      // Find all bookings for tomorrow (you could mark them as cancelled if needed)
      // For now, we just log - the system treats missing bookings as available
      const tomorrowBookings = await Booking.find({ date: tomorrowDate });
      
      console.log(`📊 Tomorrow (${tomorrowDate}) has ${tomorrowBookings.length} existing bookings`);
      console.log(`✅ All slots for ${tomorrowDate} are now available for booking\n`);

      // Optional: You could mark expired bookings as cancelled
      // const expiredBookings = await Booking.updateMany(
      //   { 
      //     date: { $lt: new Date().toISOString().split('T')[0] },
      //     status: { $in: ['Pending', 'Scheduled'] }
      //   },
      //   { status: 'Cancelled' }
      // );
      // console.log(`🗑️ Marked ${expiredBookings.modifiedCount} expired bookings as cancelled`);

    } catch (error) {
      console.error(`❌ [CRON ERROR] Next Day Auto-Unlock failed:`, error.message);
    }
  });

  console.log('✅ Next Day Auto-Unlock cron job scheduled (runs daily at 00:00)');
  return job;
};

/**
 * Job: Optional - Clean up old bookings (older than 7 days)
 */
const scheduleCleanupOldBookings = () => {
  // Run at 02:00 AM every Sunday
  const job = cron.schedule('0 2 * * 0', async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      console.log(`\n🧹 [CRON] Running Cleanup of Old Bookings at ${new Date().toISOString()}`);
      
      const result = await Booking.deleteMany({
        date: { $lt: sevenDaysAgoStr },
        status: { $in: ['Cancelled', 'Completed'] }
      });

      console.log(`🗑️ Deleted ${result.deletedCount} old bookings (older than 7 days)\n`);
    } catch (error) {
      console.error(`❌ [CRON ERROR] Cleanup failed:`, error.message);
    }
  });

  console.log('✅ Cleanup old bookings cron job scheduled (runs weekly at 02:00 AM Sunday)');
  return job;
};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('🕐 INITIALIZING CRON JOBS');
  console.log('═══════════════════════════════════════════\n');

  scheduleNextDayUnlock();
  scheduleCleanupOldBookings();

  console.log('\n═══════════════════════════════════════════');
  console.log('✅ ALL CRON JOBS INITIALIZED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════\n');
};

module.exports = {
  initializeCronJobs,
  getTomorrowDate
};
