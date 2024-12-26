class Peer {
  constructor(peerId,address) {
    this.peerId = peerId;
    this.address = address; // Add a blockchain address for the peer
    this.isValidator = false;
    this.stake = 0;
    this.rewards = 0;
  }

  getAddress = () => this.address;

  registerAsValidator = ( stake ) =>
  {
    this.isValidator = true;
    this.stake = stake;
    console.log(`Peer ${this.peerId} (${this.address}) registered as a validator with stake ${stake}`);
  }

  receiveMessage(messageType, data) {
    console.log(`Peer ${this.peerId} received message of type ${messageType}:`, data);

    // Handle different message types
    if (messageType === 'StateRootUpdated') {
      console.log(`Peer ${this.peerId} processed state root update:`, data);
    } else {
      console.warn(`Peer ${this.peerId} received unknown message type: ${messageType}`);
    }
  }

  processStateRoot = ( data )=>{
    if (this.isValidator) {
      console.log(`Validator ${this.peerId} (${this.address}) is processing state root update:`, data);
    } else {
      console.log(`Peer ${this.peerId} is not a validator but received state root update.`);
    }
  }

  addReward = ( amount ) =>
  {
    if ( this.isValidator ) {
      this.rewards += amount;
      console.log( `Validator ${ this.peerId } (${ this.address }) received reward of ${ amount }` );
    }
  };
}

module.exports = Peer;