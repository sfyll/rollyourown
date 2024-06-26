import manifest from "../../../manifest.json";

export type Config = ReturnType<typeof dojoConfig>;

export function dojoConfig() {
  return {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:5050",
    toriiUrl: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://0.0.0.0:8080",
    masterAddress:
      process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "0x6162896d1d7ab204c7ccac6dd5f8e9e7c25ecd5ae4fcb4ad32e57786bb46e03",
    masterPrivateKey:
      process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY || "0x1800000000300000180000000000030000000000003006001800006600",
    accountClassHash:
      process.env.NEXT_PUBLIC_ACCOUNT_CLASS_HASH ||
      "0x05400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c",
    manifest,
    seismic_url: process.env.SEISMIC_PUBLIC_RPC_ENDPOINT || "http://localhost:5025",
  };
}
