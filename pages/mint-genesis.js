// Standard Next and CSS imports
import Head from "next/head";
import { Fragment, useState, useEffect } from "react";
import styles from "../styles/dashboard.module.css";
import { useRouter } from "next/router";

// Imports from the constants.js file
import { alchemyApiKey, contractAddress } from "@/data/constants";

// Wagmi import for connected wallet info
import { useAccount } from "wagmi";

// Ethers for invoking functions on smart contract
import { ethers } from 'ethers';

// Contract ABI import
import contract from '@/contracts/AlchemonNft.json';

// Extract ABI from the ABI JSON file
const abi = contract.abi;

export default function MintGenesis() {

    // Standard Next router definition
    const router = useRouter();

    // Get connected wallet address and connection status
    const { address, isConnected } = useAccount();

    // Page mounting info to prevent hydration errors
    const [hasMounted, setHasMounted] = useState(false);

    // Minting state
    const [isMinting, setIsMinting] = useState(false);

    // Form error message
    const [formError, setFormError] = useState(null);

    // Mounting fix to avoid hydration errors
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Do not render until entire UI is mounted  
    if (!hasMounted) return null;

    // Redirect to Connect page if wallet is not connected
    if (!isConnected) {
        router.replace('/connect');
    }

    const mintNft = async () => {
        try {
            const { ethereum } = window;

            if (ethereum) {

                setIsMinting(true);
                setFormError(false);
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const nftContract = new ethers.Contract(contractAddress, abi, signer);

                console.log("Initialize payment");
                let nftTxn = await nftContract.mintGenesis(1, { value: ethers.utils.parseEther('0.005') });

                console.log("Mining... please wait");
                await nftTxn.wait();

                console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);
                router.push({
                    pathname: '/',
                    query: { event: 'mint' },
                }, '/');

            } else {
                console.log("Ethereum object does not exist");
            }

        } catch (err) {
            setIsMinting(false);
            setFormError(true);
            console.log(err);
        }
    }

    return (
        <Fragment>
            <Head>
                <title>Mint a Genesis NFT</title>
            </Head>

            <div className={styles.jumbotron}>

                <h1>Get your Genesis Alchemon!</h1>

                <button onClick={mintNft}>
                    Mint NFT
                </button>
                {isMinting && <p>Your NFT is minting...</p>}
                {formError && <p>Something went wrong! Try again.</p>}
            </div>
        </Fragment>
    )
}