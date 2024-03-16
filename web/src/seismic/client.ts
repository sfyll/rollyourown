import { Account, WeierstrassSignatureType } from "starknet";
import { getNonce, stringifyBigInts} from "./lib/utils"; 
import { signTypedDataStarknet } from "./lib/signature"; 
import { tradeActionDomain, tradeActionTypeLabel, tradeActionTypes, tradeParametersActionDomain, tradeParametersActionTypeLabel, tradeParametersActionTypes } from "./lib/eip712.types";
import axios from "axios";

class SeismicClient {
  private account: Account;
  private seismic_url: string;

  constructor(account: Account, seismic_url: string) {
    this.account = account;
    this.seismic_url = seismic_url;
  }

  /*
  * Fetch trade parameters pre-image for the location that matches
  * the player's
  */
  async getTradeParameters(game_id: string) {
    let senderNonce = await getNonce(this.account, this.seismic_url);

    const tx = {
      nonce: BigInt(senderNonce).toString(),
      player_id: this.account.address,
      game_id: game_id.toString(),
    };

    const signature = await signTypedDataStarknet(
      this.account,
      tradeParametersActionTypes, 
      tradeParametersActionTypeLabel, 
      tradeParametersActionDomain, 
      tx
    ) as WeierstrassSignatureType;

    try {
        const response = await axios.post(`${this.seismic_url}/trade/tradeParameters`, {
            tx: stringifyBigInts(tx),
            signature: stringifyBigInts(signature),
    });
    if (response.data.message === "No market at home location") {
        return undefined;
    }
    else {
        return response.data;
    }
    } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
            throw new Error(`HTTP error! status: ${error.response.status}`);
        }
    }
  }

  async getDataAvailabilitySignature(game_id: string,  drug_id: string) { 
    let senderNonce = await getNonce(this.account, this.seismic_url);

    const tx = {
      nonce: BigInt(senderNonce).toString(),
      player_id: this.account.address,
      game_id: game_id.toString(),
      drug_id: drug_id.toString(),
    };

    const signature = await signTypedDataStarknet(
      this.account,
      tradeActionTypes,
      tradeActionTypeLabel,
      tradeActionDomain,
      tx
    ) as WeierstrassSignatureType;
    
    try {
        const response = await axios.post(`${this.seismic_url}/trade/tradeDavail`, {
            tx: stringifyBigInts(tx),
            signature: stringifyBigInts(signature),
    });
    return response
    } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
        console.log("error status: ", error.response)
            throw new Error(`HTTP error! status: ${error.response.status}`);
        }
    }

 }
}

export default SeismicClient;
