import Head from "next/head";
import { Fragment } from "react";
import styles from "../styles/dashboard.module.css";
import { Network, Alchemy } from "alchemy-sdk";
import { alchemyApiKey, contractAddress } from "@/data/constants";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

export default function Dashboard() {

    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [hasMounted, setHasMounted] = useState(false);
    const [nfts, setNfts] = useState([]);

    // Initialize Alchemy SDK
    const settings = {
        apiKey: alchemyApiKey,
        network: Network.ETH_GOERLI,
    };

    const alchemy = new Alchemy(settings);

    useEffect(() => {
        setHasMounted(true);
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

    // Redirect to Connect page if wallet is not connected
    if (!hasMounted) return null;
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
                                <img src={nft.media[0].gateway}></img>
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
