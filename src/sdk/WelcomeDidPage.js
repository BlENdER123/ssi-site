import React, {useState} from "react";
import {HashRouter as Router, Link} from "react-router-dom";
import {ProviderRpcClient, RawProviderApiResponse} from "ton-inpage-provider";

import {Account} from "@tonclient/appkit";
import {libWeb} from "@tonclient/lib-web";
import {signerKeys, TonClient, signerNone} from "@tonclient/core";
import {DidStorageContract} from "./contracts/DidStorageContract.js";
import {DEXClientContract} from "../extensions/contracts/testNet/DEXClientMainNet.js";
import {DidDocumentContract} from "./contracts/DidDocumentContract.js";

import {useQuery} from "react-query";

//const {TonClient} = require("@tonclient/core");
TonClient.useBinaryLibrary(libWeb);
const client = new TonClient({network: {endpoints: ["net.ton.dev"]}});

const pidCrypt = require("pidcrypt");
require("pidcrypt/aes_cbc");

let dexrootAddr =
	"0:49709b1fa8adc2768c4c90f1c6fef0bdb01dc959a8052b3ed072de9dfd080424";

let walletAddr =
	"0:da136604399797f5d012ed406d541f4046d2aa5eca55290d500d2bcdfd9e2148";

const request = () =>
	fetch("http://ssi.defispace.com:4001/graphql", {
		method: "POST",
		headers: {"Content-Type": "application/json; charset=utf-8"},
		body: JSON.stringify({
			query:
				'mutation loginGenerate{loginGenerate(did:"978cae5ccb0048de4bf6c76ffba5c2686987fd72494137de8373a84e5f720063")}',
		}),
	}).then((response) => response.json());

const request2 = (hex) =>
	fetch("http://ssi.defispace.com:4001/graphql", {
		method: "POST",
		headers: {"Content-Type": "application/json; charset=utf-8"},
		body: JSON.stringify({
			query:
				'mutation LoginVerify{loginVerify(did:"978cae5ccb0048de4bf6c76ffba5c2686987fd72494137de8373a84e5f7200rt",signatureHex:"' +
				hex +
				'")}',
		}),
	}).then((response) => response.json());

function WelcomeDidPage() {
	const [didDoc, setDidDoc] = useState();

	const seed = sessionStorage.seed;

	const [pubK, setPubK] = useState();

	async function getClientKeys(phrase) {
		//todo change with only pubkey returns
		let test = await client.crypto.mnemonic_derive_sign_keys({
			phrase,
			path: "m/44'/396'/0'/0/0",
			dictionary: 1,
			word_count: 12,
		});
		return test;
	}
	//setPubK((getClientKeys(seed)).public);

	async function DidCreate() {
		// const storageAcc = new Account(DidStorageContract, {
		// 	address: dexrootAddr,
		// 	signer: signerNone(),
		// 	client,
		// });

		const acc = new Account(DEXClientContract, {
			address: localStorage.address,
			signer: signerKeys(await getClientKeys(sessionStorage.seed)),
			client,
		});

		try {
			let pubkey = (await getClientKeys(seed)).public;

			const newDIDDoc = {
				id: pubkey.toString(),
				createdAt: new Date().getTime().toString(),
				"@context": [
					"https://www.w3.org/ns/did/v1",
					"https://w3id.org/security/suites/ed25519-2020/v1",
				],
				publicKey: pubkey.toString(),
				verificationMethod: {
					id: null,
					type: "Ed25519VerificationKey2020",
					controller: null,
					publicKeyMultibase: pubkey,
				},
			};

			const {body} = await client.abi.encode_message_body({
				abi: {type: "Contract", value: DidStorageContract.abi},
				signer: {type: "None"},
				is_internal: true,
				call_set: {
					function_name: "addDid",
					input: {
						pubKey: "0x" + pubkey,
						didDocument: JSON.stringify(newDIDDoc),
					},
				},
			});

			const res = await acc.run("sendTransaction", {
				dest: dexrootAddr,
				value: 500000000,
				bounce: true,
				flags: 3,
				payload: body,
			});

			console.log(res);
		} catch (e) {
			console.log(e);
		}

		// if (!dryRun) {
		//     const response = await this.ton.rawApi.sendMessage({
		//         sender: walletAddr,
		//         recipient: dexrootAddr,
		//         amount: '20000000',
		//         bounce: true,
		//         payload: {
		//             abi: JSON.stringify(DidStorageContract),
		//             method: 'addDid',
		//             params: {
		//                 pubKey: pubkey,
		//                 didDocument: JSON.stringify(newDIDDoc)
		//             }
		//         }
		//     });
		//     console.log('response');
		//     console.log(response);
	}

	// async function createDID1(dryRun = false) {

	//     }

	// 	setDidDoc(newDIDDoc);
	// 	console.log(newDIDDoc);
	//     return newDIDDoc;
	// }

	async function createDID() {
		const acc = new Account(DidStorageContract, {
			address: dexrootAddr,
			signer: signerNone(),
			client,
		});

		const result = await acc.runLocal("resolveDidDocument", {
			id: "0x" + (await getClientKeys(seed)).public,
			//id: "0xbc091893ff845eb4f1b8a31f8855be7cecf57920070b78f15b06bffc2800fe4e"
		});
		console.log(result);
		//let value0 = response.decoded.output.value0;
		//console.log(value0);

		const acc2 = new Account(DidDocumentContract, {
			address: result.decoded.output.addrDidDocument,
			signer: signerNone(),
			client,
		});
		const res2 = await acc2.runLocal("getDid", {});

		console.log(res2);
	}

	let res = request();

	let generateResult;
	res.then((response) => {
		console.log(response);
		generateResult = response.data.loginGenerate;

		let res2 = request2(generateResult);

		res2.then((response2) => {
			console.log(response2);
		});
	});

	return (
		<Router>
			<div className="modal-w modal-welcome">
				<div className="text">Welcome!</div>

				{/* <a href="#/login-did">
					<button type="button" className="btn btn-secondary">
						I want to create DID
					</button>
				</a> */}
				<button type="button" className="btn btn-secondary" onClick={DidCreate}>
					I want to create DID
				</button>
				<button type="button" className="btn btn-secondary" onClick={createDID}>
					I want to create DID2
				</button>
				<button type="button" className="btn btn-secondary">
					Create mutation
				</button>
			</div>
		</Router>
	);
}

export default WelcomeDidPage;
