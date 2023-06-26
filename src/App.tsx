
// import functionalities
import React from 'react';
import logo from './logo.svg';
import './App.css';
import {
  PublicKey,
  Transaction,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  SystemProgram,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { useEffect, useState } from "react";
window.Buffer = window.Buffer || require("buffer").Buffer;

// create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

/**
 * @description gets Phantom provider, if it exists
 */
const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};


function App() {
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );

  // create state variable for the wallet key
  const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(
    undefined
  );
  // create state variable for the wallet key
  const [publicKey, setPublicKey] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<Uint8Array | undefined>(undefined);
  // Connect to the Devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
    const provider = getProvider();

    // if the phantom provider exists, set this as the provider
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  /**
   * @description prompts user to connect wallet if it exists.
   * This function is called when the connect wallet button is clicked
   */
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        // connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        console.log('wallet account ', response.publicKey.toString());
        // update walletKey to be the public key
        setWalletKey(response.publicKey.toString());
      } catch (err) {
        // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };

  /**
   * Generates an account and airdrops 2 Sol to it
   */
  const generateAccount = async () => {
    // Create a new keypair
    const newPair = new Keypair();

    // Extract the public and private key from the keypair
    const publicKey = new PublicKey(newPair.publicKey).toString();
    // Set the public key
    setPublicKey(publicKey);
    // Set the pirvate key
    const privateKey = newPair.secretKey;
    // Set the private key
    setPrivateKey(privateKey);

    alert(`Account created with public key ${publicKey}`)

    console.log("Private key is ", privateKey)
    console.log("Public key is ", publicKey)
  }

  const airDropSol = async () => {
    try {
      // Connect to the Devnet and make a wallet from privateKey
      const myWallet = await Keypair.fromSecretKey(privateKey!);

      // Request airdrop of 2 SOL to the wallet
      console.log("Airdropping some SOL to my wallet!");
      const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(publicKey),
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature);
      alert("New account funded with 2 SOL")
    } catch (err) {
      console.log(err);
    }
  };

  const transferSol = async () => {

    try {
      // Send money from "from" wallet and into "to" wallet
      var transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(walletKey!.toString()),
          lamports: 1 * LAMPORTS_PER_SOL // 1 sol
        })
      );

      // Sign transaction
      var signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [Keypair.fromSecretKey(privateKey!)]
      );
      console.log(`Sent 1 SOL to ${walletKey!.toString()}`);;
      alert(`1 SOL sent to ${walletKey!.toString()}`)
    } catch (error) {
      console.log(error)
      alert(error)
    }
  }


  return (
    <div className="App">

      <h2>Solana transfer</h2>

      <div>
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={generateAccount}
        >
          Create a new Solana Account
        </button>
      </div>
      <br />

      <div>
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={airDropSol}
        >
          Fund new Solana account
        </button>
      </div>
      <br />

      {provider && !walletKey && (
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}
      {provider && walletKey &&
        <div>
          <p>Account connected with address {walletKey.toString()}</p>
          <div>
            <button
              style={{
                fontSize: "16px",
                padding: "15px",
                fontWeight: "bold",
                borderRadius: "5px",
              }}
              onClick={transferSol}
            >
              Transfer to new wallet
            </button>
          </div>
          <br />


        </div>}

      {!provider && (
        <p>
          No provider found. Install{" "}
          <a href="https://phantom.app/">Phantom Browser extension</a>
        </p>
      )}
    </div>
  );
}

export default App;
