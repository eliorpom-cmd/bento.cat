import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();
crons.interval('expire visitor records', { hours: 1 }, internal.retention.cleanup, {});
crons.interval('retry account deletions', { minutes: 15 }, internal.accounts.retryDeletions, {});
export default crons;
