import Head from "next/head";
import { Fragment } from "react";
import styles from "../styles/dashboard.module.css";

export default function Dashboard() {

    return (
        <Fragment>
            <Head>
                <title>Profile Dashboard</title>
            </Head>
            <h1>Dashboard</h1>
        </Fragment>
    )
}
