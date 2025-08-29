
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export function useRealtimeConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();
    const channels = typeof supabase.getChannels === "function" ? supabase.getChannels() : [];
  const client = channels.length > 0 && "socket" in channels[0] ? (channels[0] as any).socket : null;

    if (!client || !client.stateChangeCallbacks) {
      // Fallback: poll connection state every 2s
      const interval = setInterval(() => {
        const fallbackClient = channels.length > 0 && "socket" in channels[0] ? (channels[0] as any).socket : null;
        setIsConnected(fallbackClient?.isConnected?.() ?? true);
      }, 2000);
      return () => clearInterval(interval);
    }

    // Use stateChangeCallbacks for connection events
    const openCb = () => setIsConnected(true);
    const closeCb = () => setIsConnected(false);
    const errorCb = () => setIsConnected(false);
    client.stateChangeCallbacks.open.push(openCb);
    client.stateChangeCallbacks.close.push(closeCb);
    client.stateChangeCallbacks.error.push(errorCb);

    // Initial state
    setIsConnected(client.isConnected?.() ?? true);

    return () => {
  client.stateChangeCallbacks.open = client.stateChangeCallbacks.open.filter((cb: () => void) => cb !== openCb);
  client.stateChangeCallbacks.close = client.stateChangeCallbacks.close.filter((cb: () => void) => cb !== closeCb);
  client.stateChangeCallbacks.error = client.stateChangeCallbacks.error.filter((cb: () => void) => cb !== errorCb);
    };
  }, []);

  return isConnected;
}
