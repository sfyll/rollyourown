import { PlayerEntityStore, usePlayerEntityStore } from "@/hooks/player";
import {
    BurnerAccount,
    BurnerManager,
    useBurnerManager,
} from "@dojoengine/create-burner";
import { ReactNode, createContext, useContext, useMemo } from "react";
import { Account, RpcProvider } from "starknet";
import { SetupResult } from "../setup/setup";
import SeismicClient from "@/seismic/client";

interface DojoContextType extends SetupResult {
    masterAccount: Account;
    account: Account | null;
    playerEntityStore: PlayerEntityStore;
    burner:BurnerAccount;
    seismic: SeismicClient;
}

export const DojoContext = createContext<DojoContextType | null>(null);

export const DojoProvider = ({
    children,
    value,
}: {
    children: ReactNode;
    value: SetupResult;
}) => {
    const currentValue = useContext(DojoContext);
    if (currentValue) throw new Error("DojoProvider can only be used once");

    const {
        config: { rpcUrl, masterAddress, masterPrivateKey, accountClassHash, seismic_url },
    } = value;

    const rpcProvider = useMemo(
        () =>
            new RpcProvider({
                nodeUrl: rpcUrl,
            }),
        [rpcUrl]
    );

    const masterAccount = useMemo(
        () => new Account(rpcProvider, masterAddress, masterPrivateKey,"1"),
        [rpcProvider, masterAddress, masterPrivateKey]
    );

    const {
        create,
        list,
        get,
        account,
        select,
        isDeploying,
        clear,
        copyToClipboard,
        applyFromClipboard,
    } = useBurnerManager({
        burnerManager: new BurnerManager({
            masterAccount,
            accountClassHash,
            rpcProvider,
        }),
    });

    const playerEntityStore =  usePlayerEntityStore()
    
    const seismic = useMemo(() => new SeismicClient(account as Account, seismic_url), [account, seismic_url]);

    return (
        <DojoContext.Provider
            value={{
                ...value,
                masterAccount,
                burner: {
                    create,
                    list,
                    get,
                    select,
                    clear,
                    account: account ? account : masterAccount,
                    isDeploying,
                    copyToClipboard,
                    applyFromClipboard,
                },
                account,
                playerEntityStore,
                seismic
            }}
        >
            {children}
        </DojoContext.Provider>
    );
};
