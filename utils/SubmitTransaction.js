const xrpl = require( "xrpl" );

const XRPL_SERVER = 'wss://s.altnet.rippletest.net:51233';

const submitTransaction = async ( stateRoot, batchId, submitterAccount,batchSize ) =>
{
  const client = new xrpl.Client( XRPL_SERVER );
  await client.connect();
  console.log( "Connected to XRPL server" );

  let transactionSuccessful = false; // Initialize success flag
  // Start timing for throughput calculation
  const startTime = Date.now();
  try {

    const wallet = xrpl.Wallet.fromSeed( submitterAccount.secret );


      // Prepare the transaction
      const transaction = {
        TransactionType: 'AccountSet',
        Account: wallet.address,
        Memos: [
          {
            Memo: {
              MemoData: Buffer.from( stateRoot ).toString( 'hex' ),
              MemoFormat: Buffer.from( 'text/plain' ).toString( 'hex' ),
              MemoType: Buffer.from( `StateRoot:${ batchId }` ).toString( 'hex' ),
            },
          },
        ],
        // LastLedgerSequence: currentLedgerIndex + 100, // 20-ledger buffer
      };

      // Autofill the transaction fields
      const preparedTx = await client.autofill( transaction );

      // Sign the transaction
      const signedTx = wallet.sign( preparedTx );
      console.log( 'Transaction signed.' );

      // Submit the transaction
      try {
        const result = await client.submitAndWait( signedTx.tx_blob );
        console.log( 'Transaction result:', result );

        // Check transaction status
        if ( result.result.meta.TransactionResult === 'tesSUCCESS' ) {
          console.log( `State root successfully submitted to XRPL by ${ wallet.address }.` );
          transactionSuccessful = true;
        } else {
          console.error( 'Failed to submit state root:', result.result.meta.TransactionResult );
        }
      } catch ( error ) {
        console.error( 'Error submitting transaction:', error.message );
        if ( error.message.includes( 'LastLedgerSequence' ) ) {
          console.log( 'Retrying with updated ledger sequence...' );
        } else {
          throw error; // Re-throw for non-ledger-sequence issues
        }
      }

    if ( !transactionSuccessful ) {
      console.error( 'Failed to submit transaction after 3 attempts.' );
    }
  } catch ( error ) {
    console.error( 'Error submitting transaction:', error );
    throw error;
  } finally {
    client.disconnect();
    console.log( 'Disconnected from XRPL server.' );
    // Calculate throughput
    const endTime = Date.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    const throughput = batchSize / durationInSeconds;

    console.log(`Batch Throughput XRPL: ${throughput.toFixed(2)} transactions/second`);
    console.log(`Total Duration XRPL: ${durationInSeconds.toFixed(2)} seconds`);
  }
};

module.exports = submitTransaction;