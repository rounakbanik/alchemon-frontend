import '@/styles/globals.css'

import { WagmiConfig, createClient, configureChains, goerli } from "wagmi";
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { alchemyApiKey } from '@/data/constants';

// Configure chains
const { chains, provider, webSocketProvider } = configureChains(
  [goerli],
  [alchemyProvider({ apiKey: alchemyApiKey }), publicProvider()],
);

// Set up client
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
  ],
  provider,
  webSocketProvider,
})

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig client={client}>
      <Component {...pageProps} />
    </WagmiConfig>
  )
}
