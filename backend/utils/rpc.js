const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wraps an async function with exponential backoff retry logic for 429 errors.
 * @param {Function} fn - The async function to execute (should return a Promise).
 * @param {number} maxRetries - Maximum number of retries (default: 3).
 * @param {number} baseDelay - Initial delay in ms (default: 500).
 * @returns {Promise<any>} - The result of the function execution.
 */
const fetchWithRetry = async (fn, maxRetries = 3, baseDelay = 500) => {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      // Check for 429 Too Many Requests
      // Solana web3.js errors might manifest in different ways, checking for '429' in message is a common heuristic.
      const isRateLimit = (error.message && error.message.includes('429')) ||
                          (error.response && error.response.status === 429) ||
                          (error.code === 429);

      if (isRateLimit) {
        retries++;
        if (retries > maxRetries) {
          throw error;
        }
        const waitTime = baseDelay * Math.pow(2, retries - 1);
        console.warn(`RPC Rate Limit (429). Retrying in ${waitTime}ms... (Attempt ${retries}/${maxRetries})`);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
};

module.exports = { fetchWithRetry };
