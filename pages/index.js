import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { Network, Alchemy } from "alchemy-sdk";
import { alchemyApiKey, contractAddress } from "@/data/constants";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useState, useEffect, Fragment } from "react";
import contract from '@/contracts/AlchemonNft.json';
import { ethers } from 'ethers';

const abi = contract.abi;

export default function Home() {

  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [hasMounted, setHasMounted] = useState(false);
  const [samples, setSamples] = useState([]);
  const [contracts, setContracts] = useState([]);
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

  useEffect(() => {
    setHasMounted(true)
  }, []);

  // Get all Alchemon NFTs owned by the connected wallet
  useEffect(() => {
    const getNfts = async () => {
      const response = await alchemy.nft.getNftsForOwner(address);
      const nfts = response.ownedNfts.filter(nft => nft.contract.address.toUpperCase() === contractAddress.toUpperCase());
      console.log(nfts);
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

  // Redirect to Connect page if wallet is not connected
  if (!hasMounted) return null;
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

  const mintNft = async (e) => {

    e.preventDefault();

    console.log(parent1, parent2);

    if (parent1 === 'none' || parent2 === 'none' || parent1 === parent2) {
      console.log("Incorrect parents");
      return;
    }

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
