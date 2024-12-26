const submitTransaction = require( "./SubmitTransaction" );

const finalizeStateRoot = async (stateRoot, batchId, validators, submitterAccount, batchSize) =>{
  let isConsensusReached = false;

  const requiredVotes = Math.floor( validators.length / 2 ) + 1;
  
  const votes = validators.filter( validator => validator.hasVotedFor( stateRoot ) );
  
  if (votes.length >= requiredVotes) {
    isConsensusReached = true;
    console.log(`Consensus reached for state root: ${stateRoot}`);
  } else {
    console.log(`Not enough votes. Consensus not reached for state root: ${stateRoot}`);
    return; // Exit if consensus is not reached
  }

  // Submit the state root to XRPL
  if (isConsensusReached) {
    try {
      // Submit the finalized state root to XRPL
      await submitTransaction(stateRoot, batchId, submitterAccount, batchSize);
    } catch (error) {
        console.error('Failed to submit state root to XRPL:', error.message);
    }
  }
};

module.exports = finalizeStateRoot;