import schedule from 'node-schedule';

let Avg_Response_Time = '1 hours';

// Run every 3 days at midnight
schedule.scheduleJob('0 0 */3 * *', () => {
    
    // Rotate between 1, 2, and 3 hours
    if (Avg_Response_Time === '1 hours') {
        Avg_Response_Time = '2 hours';
    } else if (Avg_Response_Time === '2 hours') {
        Avg_Response_Time = '3 hours';
    } else {
        Avg_Response_Time = '1 hours';
    }
});

export { Avg_Response_Time };


