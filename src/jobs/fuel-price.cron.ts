import cron from 'node-cron';
import { refreshFuelPrice } from '../services/fuel-price.service.js';

/**
 * Weekly UK fuel price refresh cron job.
 *
 * Runs every Monday at 06:00 UTC — GOV.UK publishes weekly road fuel
 * prices on Mondays, so we refresh shortly after.
 *
 * Schedule: "0 6 * * 1" = minute 0, hour 6, every Monday
 */
export const startFuelPriceCron = () => {
    cron.schedule('0 6 * * 1', async () => {
        console.log('[CRON] Refreshing UK fuel price...');
        try {
            const result = await refreshFuelPrice('GB');
            console.log(
                `[CRON] UK fuel price refreshed: £${result.pricePerLiter}/L (effective: ${result.effectiveDate || 'unknown'})`
            );
        } catch (error) {
            console.error('[CRON] UK fuel price refresh failed:', error instanceof Error ? error.message : error);
        }
    }, {
        timezone: 'Europe/London',
    });

    console.log('[CRON] Fuel price refresh scheduled: every Monday at 06:00 UTC');
};
