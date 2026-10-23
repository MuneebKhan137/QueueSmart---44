// placeholder so queues work

// minutes until this position's turn
const estimateWait = (position, durationMinutes) => {
    if (!Number.isSafeInteger(position) || position < 1) {
        throw new RangeError("Position must be a positive whole num.");
    }
    const peopleAhead = position - 1;
    return peopleAhead * durationMinutes;
};

module.exports = { estimateWait };
