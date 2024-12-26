// validator_worker.js
const { parentPort, workerData } = require('worker_threads');
const ValidatorProcessing = require('../utils/Validator');

// Create an instance of ValidatorProcessing to reuse its validation logic
const validator = new ValidatorProcessing();

// Function to validate a subset of transactions
const validateTransactions = (transactions) => {
  for (const transaction of transactions) {
    if (!validator.verifyTransactionSignature(transaction)) {
      return false; // If any transaction is invalid, mark the whole batch as invalid
    }
  }
  return true; // All transactions in the subset are valid
};

// Validate the transactions passed via workerData
const isValid = validateTransactions(workerData);

// Send the result back to the main thread
parentPort.postMessage(isValid);
