// placeholder so queues work
// keep the  name but replace inside

// minutes until this position's turn
const estimateWait = (position, durationMinutes) => (position - 1) * durationMinutes;

module.exports = { estimateWait };
