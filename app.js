const Consensus = require( "./services/Consensus" );
const Peer = require( "./utils/Peer" );
const crypto = require( "crypto" );


// Function to generate a random transaction
const generateRandomTransaction = () =>
{
  const from = `0x${Math.random().toString(16).substr(2, 8)}`;
  const to = `0x${Math.random().toString(16).substr(2, 8)}`;
  const value = Math.floor(Math.random() * 100) + 1;
  const signature = crypto.createHash('sha256').update(`${from}${to}${value}`).digest('hex');
  return {
    from,
    to,
    value,
    signature
  };
};

// Function to simulate peer activity
const simulatePeerActivity = (peerId, numberOfTransactions, network) => {
  for (let i = 0; i < numberOfTransactions; i++) {
    const transaction = generateRandomTransaction();
    network.handleIncomingTransaction(peerId, transaction);
  }
};



(async () => {
  // Initialize consensus mechanism
  const consensus = new Consensus();

  // Create peers and connecting peers
  const createPeer = ( peerId ) =>
  {
    for ( let i = 1; i <= peerId; i++ ){
      const peer = new Peer( i, `0x${Math.random().toString(16).substr(2, 8)}` );
      const isValidator = i % 2 === 0; // Alternate validators and regular peers
      const stake = isValidator ? Math.floor(Math.random() * 100) + 1 : 0;

      consensus.network.connectPeer(peer.peerId, peer, isValidator, stake);

      const transactions = Math.floor(Math.random() * 10000) + 1000;// Random transactions between 1000-6000
      simulatePeerActivity( peer.peerId, transactions, consensus.network );
    }
  }

  // Connect peers to the network
  createPeer( 5 );

  // Listen for batch processing events
  consensus.transactionBatcher.on( 'batchProcess', ( batch ) =>
  {
    console.log('Processing batch in P2P network:', batch);
    consensus.processBatch( batch );
  });

  // Start consensus mechanism
  consensus.start();

  console.log('Test script running...');
})();