import { WeierstrassSignatureType } from "starknet";

export interface TradeResponse {
  commitment: string;
  signature: WeierstrassSignatureType;
}

export function convertToBigInt(obj: any): any {
  let result: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      result[key] = convertToBigInt(obj[key]);
    } else if (typeof obj[key] === "string" && /^\d+$/.test(obj[key])) {
      result[key] = BigInt(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}
