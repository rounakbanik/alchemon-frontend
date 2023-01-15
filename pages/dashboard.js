// Standard Next and CSS imports
import Head from "next/head";
import { Fragment, useState, useEffect } from "react";
import styles from "../styles/dashboard.module.css";
import { useRouter } from "next/router";

// Alchemy SDK imports for NFT API
import { Network, Alchemy } from "alchemy-sdk";

// Imports from the constants.js file
import { alchemyApiKey, contractAddress } from "@/data/constants";

// Wagmi import for connected wallet info
import { useAccount } from "wagmi";

export default function Dashboard() {

    // Standard Next router definition
    const router = useRouter();

    // Get connected wallet address and connection status
    const { address, isConnected } = useAccount();

    // Page mounting info to prevent hydration errors
    const [hasMounted, setHasMounted] = useState(false);

    // Variable that holds all Alchemons created by connected wallet
    const [nfts, setNfts] = useState([]);

    // Initialize Alchemy SDK
    const settings = {
        apiKey: alchemyApiKey,
        network: Network.ETH_GOERLI,
    };

    const alchemy = new Alchemy(settings);

    // Mounting fix to avoid hydration errors
    useEffect(() => {
        setHasMounted(true);
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

    // Do not render until entire UI is mounted  
    if (!hasMounted) return null;

    // Redirect to Connect page if wallet is not connected
    if (!isConnected) {
        router.replace('/connect');
    }

    return (
        <Fragment>
            <Head>
                <title>Profile Dashboard</title>
            </Head>

            <div className={styles.jumbotron}>

                <h1>Dashboard</h1>

                <h2>Contract Address</h2>
                <p>{address}</p>

                <h2 className={styles.nft_heading}>My NFTs</h2>
                <div className={styles.nft_container}>
                    {nfts.map(nft => {
                        return (
                            <div className={styles.nft} key={nft.tokenId}>
                                <h3>{nft.rawMetadata.name}</h3>
                                <img src={nft.media[0].raw} />
                            </div>
                        )
                    })}
                </div>

                <button onClick={() => router.replace('/')}>
                    Back to Main Page
                </button>

            </div>
        </Fragment>
    )
}
