// @ts-ignore
const snarkjs = require("snarkjs");
import { ZkpParams } from "../types/ZkpParams";

const WASM_URL = "https://raw.githubusercontent.com/sfyll/rollyourown/zkp_verif/web/src/seismic/zkp/parameters/trade.wasm";
const ZKEY_URL = "https://raw.githubusercontent.com/sfyll/rollyourown/zkp_verif/web/src/seismic/zkp/parameters/trade.zkey";
const VERIFICATION_KEY_URL = "https://raw.githubusercontent.com/sfyll/rollyourown/zkp_verif/web/src/seismic/zkp/parameters/trade.vkey.json";

const makeProof = async (proofInput: any) => {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(proofInput, WASM_URL, ZKEY_URL);
    return { proof, publicSignals };
};

const verifyProof = async (signals: any, proof: any) => {
    const response = await fetch(VERIFICATION_KEY_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch verification key, status: ${response.status}`);
    }
    const vkey = await response.json();

    const res = await snarkjs.groth16.verify(vkey, signals, proof);
    return res;
};

export async function createAndVerifyProof(proofInput: ZkpParams): Promise<boolean> {
    try {
        const { proof, publicSignals } = await makeProof(proofInput);
        const isValid = await verifyProof(publicSignals, proof);
        if (!isValid) {
            throw new Error('Proof verification failed.');
        }

        return isValid ;
    } catch (error) {
        throw error; 
    }
}
