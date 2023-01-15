// Standard Next and CSS imports
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { useRouter } from "next/router";
import { useState, useEffect, Fragment } from "react";

// Alchemy SDK imports for NFT API
import { Network, Alchemy } from "alchemy-sdk";

// Imports from the constants.js file
import { alchemyApiKey, contractAddress } from "@/data/constants";

// Wagmi import for connected wallet info
import { useAccount } from "wagmi";

// Contract ABI import
import contract from '@/contracts/AlchemonNft.json';

// Ethers for invoking functions on smart contract
import { ethers } from 'ethers';

// Extract ABI from the ABI JSON file
const abi = contract.abi;

export default function Home() {

  // Standard Next router definition
  const router = useRouter();

  // Get connected wallet address and connection status
  const { address, isConnected } = useAccount();

  // Page mounting info to prevent hydration errors
  const [hasMounted, setHasMounted] = useState(false);

  // Variable that holds sample Alchemon NFTs
  const [samples, setSamples] = useState([]);

  // Variable that holds contracts created by Owner address
  const [contracts, setContracts] = useState([]);

  // Variable that holds all Alchemons created by connected wallet
  const [nfts, setNfts] = useState([]);

  // Parent Alchemons
  const [parent1, setParent1] = useState('none');
  const [parent2, setParent2] = useState('none');

  // Initialize Alchemy SDK
  const settings = {
    apiKey: alchemyApiKey,
    network: Network.ETH_GOERLI,
  };

  const alchemy = new Alchemy(settings);

  // Mounting fix to avoid hydration errors
  useEffect(() => {
    setHasMounted(true)
  }, []);

  // Get all Alchemon NFTs owned by the connected wallet
  useEffect(() => {
    const getNfts = async () => {
      const response = await alchemy.nft.getNftsForOwner(address);
      const nfts = response.ownedNfts.filter(nft => nft.contract.address.toUpperCase() === contractAddress.toUpperCase());
      setNfts(nfts);
    }
    getNfts();
  }, [])

  // Get sample Alchemon NFTs 
  useEffect(() => {
    const getSamples = async () => {
      const response = await alchemy.nft.getNftsForContract(contractAddress);
      const nfts = response.nfts.slice(0, 3);
      setSamples(nfts);
    }
    getSamples();
  }, [])

  // Get all contracts for owner
  useEffect(() => {
    const options = { method: 'GET', headers: { accept: 'application/json' } };

    fetch(`https://eth-mainnet.g.alchemy.com/nft/v2/${alchemyApiKey}/getContractsForOwner?owner=${address}`, options)
      .then(response => response.json())
      .then(response => setContracts(response.contracts))
      .catch(err => console.error(err));
  }, [])

  // Do not render until entire UI is mounted  
  if (!hasMounted) return null;

  // Redirect to Connect page if wallet is not connected
  if (!isConnected) {
    router.replace('/connect');
  }

  // Form handlers
  const parent1Handler = (e) => {
    setParent1(e.target.value);
  }

  const parent2Handler = (e) => {
    setParent2(e.target.value);
  }


  // Function that allows breeding of NFTs using 2 parent NFTs
  const mintNft = async (e) => {

    e.preventDefault();

    // Only allow breeding if the parents are distinct 
    if (parent1 === 'none' || parent2 === 'none' || parent1 === parent2) {
      console.log("Incorrect parents");
      return;
    }

    // Call the breed function from connected wallet
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, abi, signer);

        console.log("Initialize payment");
        let nftTxn = await nftContract.breed(parseInt(parent1), parseInt(parent2));

        console.log("Mining... please wait");
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);
        router.replace('/dashboard');

      } else {
        console.log("Ethereum object does not exist");
      }

    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Fragment>

      <Head>
        <title>Alchemon</title>
        <meta name="description" content="A simple NFT based game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>Alchemon</h1>

        <button onClick={() => router.push('/dashboard')}>
          Profile Dashboard
        </button>

        <h2>Breed a New Alchemon</h2>

        <form className={styles.breed_form} onSubmit={mintNft}>
          <select name="parent1" id="parent1" value={parent1} onChange={parent1Handler}>
            <option value="none">---</option>
            {nfts.map(nft => {
              return <option value={nft.tokenId} key={nft.tokenId}>{nft.title}</option>
            })}
          </select>
          <select name="parent2" id="parent2" value={parent2} onChange={parent2Handler}>
            <option value="none">---</option>
            {nfts.map(nft => {
              return <option value={nft.tokenId} key={nft.tokenId}>{nft.title}</option>
            })}
          </select>
          <button type='submit'>Breed</button>
        </form>

        <h2>Sample Alchemon NFTs</h2>
        <div className={styles.sample_nfts}>
          {samples.map(nft => {
            return (
              <div className={styles.nft} key={nft.tokenId}>
                <h3>{nft.title}</h3>
                <img src={nft.media[0].raw} />
              </div>
            )
          })}
        </div>

        <h2>Projects by Alchemon Creators</h2>
        <ul className={styles.contract_container}>
          {contracts.map(contract => {
            return (
              <li key={contract.address}>
                <a href={`https://goerli.etherscan.io/address/${contract.address}`} target="_blank">
                  {contract.address}
                </a>
              </li>
            )
          })}
        </ul>

      </main>
    </Fragment>
  )
}
