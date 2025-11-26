import { Client, Account, Databases, Storage } from 'appwrite';

// User client (runs in browser)
export function createUserClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

// Connection status indicator component
export function RealtimeIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}
      />
      <span className="text-gray-600">
        {isConnected ? 'Live' : 'Connecting...'}
      </span>
    </div>
  );
}
