import React, {useState} from "react";
import {HashRouter as Router, Link} from "react-router-dom";
import {ProviderRpcClient, RawProviderApiResponse} from "ton-inpage-provider";

import {Account} from "@tonclient/appkit";
import {libWeb} from "@tonclient/lib-web";
import {signerKeys, TonClient, signerNone} from "@tonclient/core";

// import {DidStorageContract} from "./contracts/DidStorageContract.js";
import {DEXClientContract} from "../extensions/contracts/testNet/DEXClientMainNet.js";
// import {DidDocumentContract} from "./contracts/DidDocumentContract.js";

import {DidStorageContract} from "./contracts/new/DidStorageContract.js";
import {DidDocumentContract} from "./contracts/new/DidDocumentContract.js";

import {useQuery} from "react-query";

//const {TonClient} = require("@tonclient/core");
TonClient.useBinaryLibrary(libWeb);
const client = new TonClient({network: {endpoints: ["net.ton.dev"]}});

const pidCrypt = require("pidcrypt");
require("pidcrypt/aes_cbc");

// let dexrootAddr =
// 	"0:49709b1fa8adc2768c4c90f1c6fef0bdb01dc959a8052b3ed072de9dfd080424";

let dexrootAddr =
	"0:c9e74798ee45b2e57661162dedeb81e8d015402f56c597747120e0de295f7441";

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

	const [loader, setLoader] = useState(false);

	const [DID, setDID] = useState();

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

	async function createDID3() {
		const acc = new Account(DEXClientContract, {
			address: localStorage.address,
			signer: signerKeys(await getClientKeys(sessionStorage.seed)),
			client,
		});

		let pubkey = (await getClientKeys(seed)).public;

		try {
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
						addr: localStorage.address,
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

		const acc2 = new Account(DidStorageContract, {
			address: dexrootAddr,
			signer: signerNone(),
			client,
		});
		const res2 = await acc2.runLocal("resolveDidDocument", {
			id: "0x" + pubkey,
		});

		console.log(res2);

		let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;

		const didAcc = new Account(DidDocumentContract, {
			address: addrDidDoc,
			signer: signerNone(),
			client,
		});

		const resDid = await didAcc.runLocal("getDid", {});

		setDidDoc(resDid.decoded.out_messages[0].value.value0);
		console.log(resDid.decoded.out_messages[0].value.value0);

		// try {

		// 	const newDIDDoc2 = {
		// 		id: pubkey.toString()
		// 	};

		// 	const {body} = await client.abi.encode_message_body({
		// 		abi: {type: "Contract", value: DidDocumentContract.abi},
		// 		signer: {type: "None"},
		// 		is_internal: true,
		// 		call_set: {
		// 			function_name: "newDidStatus",
		// 			input: {
		// 				status: false,
		// 			},
		// 		},
		// 	});

		// 	const res = await acc.run("sendTransaction", {
		// 		dest: dexrootAddr,
		// 		value: 500000000,
		// 		bounce: true,
		// 		flags: 3,
		// 		payload: body,
		// 	});

		// 	console.log(res);

		// 	const resDid2 = await didAcc.runLocal("getDid", {});

		// 	console.log(resDid2);

		// } catch (e) {
		// 	console.log(e);
		// }

		// const resDid2 = await didAcc.runLocal("getDid", {});

		// 	console.log(resDid2);

		// console.log(pubkey);
	}

	async function resolveDID() {
		const acc = new Account(DEXClientContract, {
			address: localStorage.address,
			signer: signerKeys(await getClientKeys(sessionStorage.seed)),
			client,
		});

		let pubkey = (await getClientKeys(seed)).public;

		const acc2 = new Account(DidStorageContract, {
			address: dexrootAddr,
			signer: signerNone(),
			client,
		});

		const res2 = await acc2.runLocal("resolveDidDocument", {
			id: "0x" + DID,
		});

		console.log(res2);

		let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;

		const didAcc = new Account(DidDocumentContract, {
			address: addrDidDoc,
			signer: signerNone(),
			client,
		});

		const resDid = await didAcc.runLocal("getDid", {});

		setDidDoc(resDid.decoded.out_messages[0].value.value0);
		console.log(resDid.decoded.out_messages[0].value.value0);
	}

	async function updateDIDDocument() {
		const acc = new Account(DEXClientContract, {
			address: localStorage.address,
			signer: signerKeys(await getClientKeys(sessionStorage.seed)),
			client,
		});

		let pubkey = (await getClientKeys(seed)).public;

		const acc2 = new Account(DidStorageContract, {
			address: dexrootAddr,
			signer: signerNone(),
			client,
		});

		const res2 = await acc2.runLocal("resolveDidDocument", {
			id: "0x" + pubkey,
		});

		console.log(res2);

		let addrDidDoc = res2.decoded.out_messages[0].value.addrDidDocument;

		const didAcc = new Account(DidDocumentContract, {
			address: addrDidDoc,
			signer: signerNone(),
			client,
		});

		try {
			const newDIDDoc2 = {
				id: pubkey.toString(),
				createdAt: new Date().getTime().toString(),
				"@context": ["https://www.w3.org/ns/did/v1", "12312312341234123412341"],
				publicKey: pubkey.toString(),
				verificationMethod: {
					id: null,
					type: "test`23412341234",
					controller: null,
					publicKeyMultibase: pubkey,
				},
			};

			const {body} = await client.abi.encode_message_body({
				abi: {type: "Contract", value: DidDocumentContract.abi},
				signer: {type: "None"},
				is_internal: true,
				call_set: {
					function_name: "newDidDocument",
					input: {
						didDocument: JSON.stringify(newDIDDoc2),
					},
				},
			});

			// const res = await acc.run("sendTransaction", {
			// 	dest: addrDidDoc,
			// 	value: 300000000,
			// 	bounce: true,
			// 	flags: 3,
			// 	payload: body,
			// });

			// console.log(res);
		} catch (e) {
			console.log(e);
		}

		const resDid = await didAcc.runLocal("getDid", {});

		//setDidDoc(resDid.decoded.out_messages[0].value.value0);
		console.log(resDid.decoded.out_messages[0].value.value0);
	}

	return (
		<Router>
			{didDoc ? (
				<div className="modal-w modal-welcome modal-did-document">
					<div className={loader ? "lds-dual-ring" : "hide"}></div>
					<div className="text">DID Document</div>

					<div className="attribute">
						<span>status:</span>
						{didDoc.status}
					</div>
					<div className="attribute">
						{Object.keys(JSON.parse(didDoc.didDocument)).map((item, i) => {
							return (
								<div>
									<span>{item}:</span>{" "}
									{JSON.stringify(JSON.parse(didDoc.didDocument)[item])}
								</div>
							);
						})}
					</div>

					<button onClick={updateDIDDocument}>New Document</button>
					<button>Change Status</button>
					<button>New IssuerPubKey</button>
					<button>Delete Document</button>
					<button>Update Info</button>

					<div className="note">
						Note: Transactions can take 5 to 15 seconds
					</div>
				</div>
			) : (
				<div className="modal-w modal-welcome">
					<div className={loader ? "lds-dual-ring" : "hide"}></div>
					<div className="text">Welcome!</div>

					{/* <button type="button" className="btn btn-secondary" onClick={DidCreate}>
					I want to create DID
				</button>
				<button type="button" className="btn btn-secondary" onClick={createDID}>
					I want to create DID2
				</button> */}
					<button
						type="button"
						className="btn btn-secondary"
						onClick={createDID3}
					>
						I want to create DID
					</button>

					<div class="text">I already have a DID</div>
					<input
						type="text"
						placeholder="DID"
						onChange={(ev) => {
							setDID(ev.target.value);
						}}
					/>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={resolveDID}
					>
						Log in with DID
					</button>
				</div>
			)}
		</Router>
	);
}

export default WelcomeDidPage;
