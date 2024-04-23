import { Account, WeierstrassSignatureType } from "starknet";
import { getNonce, stringifyBigInts } from "./lib/utils";
import { signTypedDataStarknet } from "./lib/signature";
import {
  tradeActionDomain,
  tradeActionTypeLabel,
  tradeActionTypes,
  tradeParametersActionDomain,
  tradeParametersActionTypeLabel,
  tradeParametersActionTypes,
} from "./lib/eip712.types";
import axios from "axios";
import { TradeResponse, convertToBigInt } from "./lib/response.types";

class SeismicClient {
  private account: Account;
  private seismic_url: string;
  private seismic_smart_contract_address: string | undefined;

  constructor(account: Account, seismic_url: string) {
    this.account = account;
    this.seismic_url = seismic_url;
  }

  /*
   * Get Seismic Contract Address and store it in class memory on first call
   */
  public async getSeismicSmartContractAddress(): Promise<string> {
    if (!this.seismic_smart_contract_address) {
      this.seismic_smart_contract_address = await this.fetchContractAddress();
    }
    return this.seismic_smart_contract_address;
  }

  /*
   * Http call to get Seismic contract address
   */
  private async fetchContractAddress(): Promise<string> {
    const response = await axios.get(`${this.seismic_url}/trade/getseismicaddress`);
    if (response.status !== 200) {
      throw new Error("Could not get Seismic address");
    }
    return response.data.seismicStarknetContractAddress;
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

    const signature = (await signTypedDataStarknet(
      this.account,
      tradeParametersActionTypes,
      tradeParametersActionTypeLabel,
      tradeParametersActionDomain,
      tx,
    )) as WeierstrassSignatureType;

    try {
      const response = await axios.post(`${this.seismic_url}/trade/tradeParameters`, {
        tx: stringifyBigInts(tx),
        signature: stringifyBigInts(signature),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 406) {
          return undefined;
        } else {
          throw new Error(`HTTP error! status: ${error.response.status}`);
        }
      }
    }
  }

  async getDataAvailabilitySignature(
    game_id: string,
    drug_id: string,
    new_cash: bigint,
    new_quantity: bigint,
  ): Promise<TradeResponse> {
    const senderNonce = await getNonce(this.account, this.seismic_url);

    const tx = {
      nonce: BigInt(senderNonce).toString(),
      player_id: this.account.address,
      game_id: game_id.toString(),
      drug_id: drug_id.toString(),
      new_cash: new_cash.toString(),
      new_quantity: new_quantity.toString(),
    };

    const signature = (await signTypedDataStarknet(
      this.account,
      tradeActionTypes,
      tradeActionTypeLabel,
      tradeActionDomain,
      tx,
    )) as WeierstrassSignatureType;

    try {
      const response = await axios.post(`${this.seismic_url}/trade/tradeDavail`, {
        tx: stringifyBigInts(tx),
        signature: stringifyBigInts(signature),
      });

      return convertToBigInt(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Log the error or handle it as needed
        console.error("Axios error: ", error.message);
        if (error.response) {
          console.log("Error response status: ", error.response.status);
        }
      }
      // Rethrow the error or throw a new one if needed
      throw error;
    }
  }
}

export default SeismicClient;
