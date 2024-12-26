const EventEmitter = require( 'events' );

// Batch configuration
const BATCH_SIZE = 10000;
const BATCH_INTERVAL = 50000;

class TransactionBatcher extends EventEmitter {
  constructor(){
    super();
    this.transactions = [];
    this.timer = null;
  }

  //Add a transaction to the queue
  queueTransaction=(transaction)=>{
    this.transactions.push( transaction );
    //console.log( `Transaction added: ${ JSON.stringify( transaction ) }` );
    
    if ( this.transactions.length >= BATCH_SIZE ) {
      this.processTransactions();
    } else if ( !this.timer ) {
      this.startTimer();
    }
  }

  //Startting batch timer
  startTimer =() =>{
    this.timer = setTimeout( () =>
    {
      console.log("Batch time threshold reached");
      this.processTransactions();
    }, BATCH_INTERVAL );
  }

  //Process transactions
  processTransactions=()=>{
    if ( this.transactions.length === 0 ) return;
    const batchQueue = [ ...this.transactions ];
    this.transactions = [];
    clearTimeout( this.timer );
    this.timer = null;

    //Emit an event with the batch of transactions
    console.log( `Processing batch of ${ batchQueue.length } transactions` );
    this.emit( 'batchProcess', batchQueue );
  }

  getTransactions=()=>{
    return this.transactions;
  }

  getBatchSize=()=>{
    return BATCH_SIZE;
  }
}


module.exports = TransactionBatcher;