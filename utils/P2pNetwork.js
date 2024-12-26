const EventEmitter = require('events');
const TransactionBatcher = require( './TransactionBatcher' );
const StateManager = require( './StateManager' );
const Validator = require( './Validator' );
const submitTransaction = require( './SubmitTransaction' );
const { performance } = require( 'perf_hooks' );
const { Worker } = require('worker_threads');

const submitterAccounts = [
  {
    address: 'rwsCJp4HijKcdNZVwK2NzNwm2xfc1nduhk',
    secret: 'sEdTtE1xhKpbFiQScuGoKY2R6rcXqv5',
  },
  {
    address: 'rB9ZYfrRAJzqwquxXiEg74j4XaxfbD1Utu',
    secret: 'sEdTGNDb4PUaY3yuBB15MH8fRhUyVaN',
  },
];


class P2pNetwork extends EventEmitter{
  constructor(){
    super();
    this.peer = new Map();
    this.transactionBatcher = new TransactionBatcher();
    this.stateManager = new StateManager();
    this.validator = new Validator();


    this.transactionBatcher.on( "batchProcess", (batch)=>{
      this.handleBatchProcess( batch );
    } );

    this.performanceMetrics = {
      totalTransactions: 0,
      batchCount: 0,
      startTime: performance.now(),
      endTime: null
    };
  }

  connectPeer = ( peerId, peerInstance, isValidator = false, stake = 0 ) =>
  {
    if ( this.peer.has( peerId ) ) throw new Error( "Peer already connected" );
    if ( typeof peerInstance.receiveMessage !== 'function' ) throw new Error( `Peer ${ peerId } must implement a receiveMessage method.` );
    this.peer.set( peerId, peerInstance );
    console.log( `Peer ${ peerId } connected` );
    
    if ( isValidator ) {
      const peerAddress = peerInstance.getAddress(); // Ensure each Peer has a blockchain address.
      this.validator.addValidator(peerAddress, stake);
      console.log(`Validator ${peerId} added with stake ${stake}`);
    }
  }

  disconnectPeer = ( peerId ) =>
  {
    if ( !this.peer.has( peerId ) ) throw new Error( "Peer not connected" );
    this.peer.delete( peerId );
    console.log(`Peer ${peerId} disconnected`);
  }

  broadcastMessage = (messageType,data)=>{
    this.peer.forEach( ( peerInstance, peerId ) =>
    {
      console.log(`Broadcasting message to peer ${peerId}:`, messageType);
      if (typeof peerInstance.receiveMessage === 'function') {
        peerInstance.receiveMessage(messageType, data);
      } else {
        console.warn(`Peer ${peerId} cannot process messages. Skipping.`);
      }
    } );
  }

  queueTransaction = (transaction)=>{
    this.transactionBatcher.queueTransaction( transaction );
  }

  handleBatchProcess = async(batch)=>{
    console.log( 'Processing batch in P2P network:', batch );
    this.performanceMetrics.batchCount++;
    const validationPromises = [];
    const batchSize = Math.ceil( batch.length / 4 );
    for (let i = 0; i < 4; i++) {
      const subset = batch.slice(i * batchSize, (i + 1) * batchSize);
      validationPromises.push(this.validateSubset(subset));
    }
    Promise.all( validationPromises ).then( ( reults ) =>
    {
      const isvalid = reults.every( result => result );
      if ( isvalid ) {
        console.log(`Batch successfully validated.`);
        this.stateManager.applyTransactions(batch);
        const stateRoot = this.stateManager.calculateStateRoot();
        const batchId = Date.now();

        // Send to XRPL ledger for finality
        const submitterAccount = this.getsubmitter(batchId);
        submitTransaction(stateRoot, batchId, submitterAccount, batch.length)
          .then(() => {
            console.log(`State root ${stateRoot} finalized on XRPL.`);
          })
          .catch((error) => {
            console.error('Error finalizing state on XRPL:', error);
          });

        this.broadcastMessage('StateRootUpdated', { stateRoot, batchId });
      } else {
        console.error('Batch validation failed.');
      }

      const rewardPerValidator = 10;
      this.validator.rewardValidators(batch.length, rewardPerValidator);
      this.stateManager.printState();

      // Update performance metrics
      this.performanceMetrics.endTime = performance.now();
      this.logPerformanceMetrics();
    })
    // this.stateManager.printState();
  }


  validateSubset=(subset)=> {
    return new Promise((resolve) => {
      const worker = new Worker('./services/ValidatorWorker.js', {
        workerData: subset
      });

      worker.on('message', (isValid) => {
        resolve(isValid);
      });

      worker.on('error', (error) => {
        console.error('Worker error:', error);
        resolve(false);
      });
    });
  }

  handleIncomingTransaction = (peerId,transaction)=>{
    console.log( `Incoming transaction from peer ${peerId}:`, transaction );
    this.queueTransaction( transaction );
    this.performanceMetrics.totalTransactions++;
  }

  printPeers = ()=>{
    console.log('Connected Peers:', Array.from( this.peer.keys() ));
  }

  getsubmitter = ( batchId ) => { 
    return submitterAccounts[batchId % submitterAccounts.length];
  };
  logPerformanceMetrics=()=> {
    const durationInSeconds = (this.performanceMetrics.endTime - this.performanceMetrics.startTime) / 1000;
    const tps = this.performanceMetrics.totalTransactions / durationInSeconds;

    console.log('--- Performance Metrics ---');
    console.log(`Total Transactions: ${this.performanceMetrics.totalTransactions}`);
    console.log(`Total Batches Processed: ${this.performanceMetrics.batchCount}`);
    console.log(`Total Time: ${durationInSeconds.toFixed(2)} seconds`);
    console.log(`Transactions Per Second (TPS): ${tps.toFixed(2)}`);
    console.log('---------------------------');
  }
}

module.exports =  P2pNetwork;