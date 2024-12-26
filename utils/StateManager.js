const { MerkleTree } = require( "merkletreejs" );
const keccak256 = require( "keccak256" );

class StateManager {
  constructor(){
    this.state = new Map()
  }

  // update the state with the new batch transactions
  applyTransactions =( transactions ) =>{ 
    transactions.forEach(transaction => {
      const { from, to, value } = transaction;
      this.decreaseBalance( from, value );
      this.increaseBalance( to, value );
    });
  }

  //calculate the state root using Merkle tree
  calculateStateRoot = ()=>{
    const leaves = Array.from( this.state.entries() ).map( ( [ key, value ] ) => keccak256( `${ key }:${ value }` ) );
    const merkleTree = new MerkleTree( leaves, keccak256, { sortPairs: true } );
    const root = merkleTree.getRoot().toString( "hex" );
    return root;
  }

  printState= ()=>{
    console.log('Current State:', Object.fromEntries(this.state));
  }


  // increase the balance of the account
  increaseBalance=(account,value)=>{
    if ( this.state.has( account ) ) {
      this.state.set( account, this.state.get( account ) + value );
    } else {
      this.state.set( account, value );
    }
  }

  decreaseBalance=(account,value)=>{
    if ( this.state.has( account ) ) {
      this.state.set( account, this.state.get( account ) - value );
    } else {
      this.state.set( account, value );
    }
  }
}

module.exports = StateManager;