const EventEmitter = require( "events" );
const P2PNetwork = require( "../utils/P2pNetwork" );
const TransactionBatcher = require( "../utils/TransactionBatcher" );
const StateManager = require( "../utils/StateManager" );
const Validator = require( "../utils/Validator" );



class Consensus extends EventEmitter {
  constructor(){
    super();
    this.network = new P2PNetwork();
    this.stateManager = new StateManager();
    this.validator = new Validator();
    this.transactionBatcher = new TransactionBatcher();

    this.network.on( "transactionReceived", ( transaction ) =>
    {
      this.handleTransaction( transaction );
    } );

    this.network.on( "stateRootUpdated", ( { stateRoot, batchId } ) =>
    {
      this.broadcastState( stateRoot, batchId );
    } )
    
    this.transactionBatcher.on( "batchProcess", ( batch ) =>
    {
      this.processBatch( batch );
    } );
  }

  handleTransaction=(peerId,transaction)=>{
    console.log( "Transaction Received:", /*transaction*/ );
    this.network.handleIncomingTransaction(peerId, transaction)
  }

  processBatch=async(batch)=>{
    console.log( 'Processing batch:', /*batch*/ );
    await this.network.handleBatchProcess( batch );
  }

  broadcastState(stateRoot, batchId) {
    console.log(`Broadcasting state root ${stateRoot} for batch ${batchId}`);
    this.network.broadcastMessage('stateRootFinalized', { stateRoot, batchId });
  }

  addValidator(address, stake) {
    this.validator.addValidator(address, stake);
    this.network.connectPeer(address, this); // Connect validator as a peer
  }

  start() {
    console.log('Consensus mechanism started.');
    this.transactionBatcher.startTimer();
  }

}

module.exports = Consensus;