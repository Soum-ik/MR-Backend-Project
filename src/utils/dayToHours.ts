export function daysToHours(days: string) {
    if (typeof days !== 'number' || days < 0) {
        throw new Error("Please provide a valid non-negative number of days.");
    }
    const hours = parseInt(days) * 24;
    return hours 
}
