/**
 * PURPOSE: Opens one Socket.IO connection for the app's lifetime and
 * lets components subscribe to specific event names via a callback.
 *
 * WHY ONE SHARED SOCKET (via a module-level singleton) INSTEAD OF EACH
 * COMPONENT CALLING io() ITSELF
 * Every io() call opens a new physical connection. If the Dashboard,
 * JobList, and WorkerPanel each opened their own socket, the server
 * would see 3x the connections for one browser tab and the API's
 * broadcast would fire 3 redundant events per update. One shared
 * connection + multiple listeners is the correct pattern.
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    const url = import.meta.env.VITE_API_URL || undefined;
    sharedSocket = io(url, { withCredentials: true, transports: ['websocket', 'polling'] });
  }
  return sharedSocket;
}

export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}
