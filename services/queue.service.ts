import NetInfo from "@react-native-community/netinfo";

let online = true;

NetInfo.addEventListener((state) => {
  online = state.isConnected ?? false;
});

export function isOnline(): boolean {
  return online;
}

export async function checkNetwork(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}