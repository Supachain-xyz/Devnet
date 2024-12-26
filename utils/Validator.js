const crypto = require( "crypto" );

class Validator{
  constructor ()
  {
    this.validators = new Map();
    this.activeValidators = [];
    this.quorm = 2 / 3;
  }

  // Adding a validator
  addValidator=(address,stake)=>{
    if ( this.validators.has( address ) )  throw new Error( "Validator already exists" );
    this.validators.set( address, { stake, isActive: true,reward:0 } );
    this.updateActiveValidators();
    console.log(`Validator ${address} added with stake ${stake}`);
  }

  // Removing validator
  removeValidator=(address)=>{
    if ( !this.validators.has( address ) ) throw new Error( "Validator does not exists" );
    this.validators.delete( address );
    this.updateActiveValidators();
    console.log(`validator ${address} removed`);
  }

  // Updating Validator Lists
  updateActiveValidators=()=>{
    this.activeValidators = Array.from( this.validators.entries() )
      .filter( ( [ _, details ] ) => details.isActive )
      .map( ( [ address ] ) => address );
  }

  //Staking Tokens as a validator
  stakeTokens=(address,amount)=>{
    if ( !this.validators.has( address ) ) throw new Error( "Validator does not exists" );
    this.validators.get( address ).stake += amount;
    console.log(`validator ${address} staked an additional ${amount}`);
  }

  // Slash a validator for misbehavior
  slashValidator = ( address, penalty ) =>
  {
    if ( !this.validators.has( address ) ) throw new Error( "Validator does not exists" );
    const validator = this.validators.get( address );
    validator.stake -= penalty;
    console.log( `Validator ${ address } slashed by ${ penalty }` );
    
    if ( validator.stake <= 0 ) {
      this.removeValidator(address)
    }
  }
  
  //Reward validator for valid Processsing
  rewardValidators = (batchId,rewardPerValidator) =>{
    if ( this.activeValidators.length === 0 ) throw new Error( "No active Validator to reward" );
    console.log(`Rewarding validators for batch ${batchId}.`);
    this.activeValidators.forEach( address =>
    {
      if ( this.validators.has( address ) ) {
        this.validators.forEach( ( validator, address ) =>
        {
          validator.reward += rewardPerValidator;
          console.log( `Validator ${ address } rewarded with ${ rewardPerValidator }. Total rewards: ${ validator.reward }` );
        })
      }
    } );
  }

  //Validating Batch and collecting signatures
  validateBatch = (batchId,stateRoot)=>{
    console.log( `Validating batch ${ batchId } with state root ${ stateRoot }.` );
    const signatures = [];
    this.activeValidators.forEach( address =>
    {
      if ( this.validators.has( address ) ) {
        const signature = this.sign( stateRoot, address,batchId );
        signatures.push( signature );
      }
    } );

    const validSignatures = signatures.length >= this.getQuorumThreshold();
    console.log(
      validSignatures
        ? `Batch ${batchId} validated successfully.`
        : `Batch ${batchId} validation failed.`
    );
    return {validSignatures,signatures};
  }

  //Signing the state root
  sign = (stateRoot, address,batchId) =>{
    const hash = crypto.createHash( "sha256" );
    hash.update( stateRoot );
    hash.update( address );
    hash.update( batchId.toString() );
    return hash.digest( "hex" );
  }

  verifyTransactionSignature = ( transaction ) =>
  {
    const { from, to, value, signature } = transaction;

    if (!from || !to || value <= 0) {
      return false;
    }

    // Simulate a digital signature check
    const hash = crypto.createHash('sha256').update(`${from}${to}${value}`).digest('hex');
    return signature === hash; 
  }

  //calculate the quorum threshold
  getQuorumThreshold = () => Math.ceil( this.activeValidators.length * this.quorm );

  //Get the active validators
  getActiveValidators = () => this.activeValidators;

  //Get all validators
  getValidators = () => this.validators;

}

module.exports = Validator;