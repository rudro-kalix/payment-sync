// This service expects 'cordova-plugin-notification-listener' to be installed.
// Run: npm install cordova-plugin-notification-listener
// Run: npx cap sync

export interface NotificationEvent {
  package: string;
  title: string;
  text: string;
  ticker: string;
}

let isListening = false;

export const startNotificationListener = (onNotificationReceived: (n: NotificationEvent) => void) => {
  const plugin = (window as any).notificationListener;

  if (!plugin) {
    console.warn("Notification Listener plugin not found. Run on device with 'cordova-plugin-notification-listener'.");
    return;
  }

  try {
    console.log("Starting Notification Listener...");
    
    // 1. Check Permission (On Android, this opens the 'Notification Access' settings screen if not granted)
    plugin.requestPermission(() => {
        console.log("Notification Access Permission Check/Request Initiated");
        
        // 2. Start Listening
        if (!isListening) {
            plugin.listen((n: any) => {
                console.log("Notification Received:", n);
                // Filter logic can happen here or in App.tsx
                // We pass the raw notification up
                onNotificationReceived({
                    package: n.package || "",
                    title: n.title || "",
                    text: n.text || "",
                    ticker: n.ticker || ""
                });
            }, (err: any) => {
                console.error("Error in notification listener:", err);
            });
            isListening = true;
        }

    }, (err: any) => {
        console.error("Permission request failed", err);
        alert("Please enable Notification Access for this app in Android Settings.");
    });

  } catch (err) {
    console.error("CRITICAL: Error starting Notification listener:", err);
  }
};

export const stopNotificationListener = () => {
  // Most notification listener plugins don't have a specific 'stop' method exposed easily
  // without destroying the instance, but we can manage the state in App.tsx 
  // by ignoring incoming events or unregistering if the plugin supports it.
  // For this specific plugin, we'll just set our flag.
  isListening = false;
  console.log("Notification Listener Stopped (Logical)");
};