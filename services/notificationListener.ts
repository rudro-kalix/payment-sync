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

/**
 * Starts the notification listener.
 * Returns a Promise that resolves to true if listening started, false if permission denied or error.
 */
export const startNotificationListener = (onNotificationReceived: (n: NotificationEvent) => void): Promise<boolean> => {
  return new Promise((resolve) => {
    const plugin = (window as any).notificationListener;

    if (!plugin) {
      console.warn("Notification Listener plugin not found. Run on device with 'cordova-plugin-notification-listener'.");
      alert("Plugin not found. Are you running on a device?");
      resolve(false);
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
          resolve(true);

      }, (err: any) => {
          console.error("Permission request failed", err);
          alert("Notification Access is required. Please enable it in Android Settings.");
          resolve(false);
      });

    } catch (err) {
      console.error("CRITICAL: Error starting Notification listener:", err);
      resolve(false);
    }
  });
};

export const stopNotificationListener = () => {
  // Most notification listener plugins don't have a specific 'stop' method exposed easily
  // without destroying the instance, but we can manage the state in App.tsx 
  // by ignoring incoming events or unregistering if the plugin supports it.
  isListening = false;
  console.log("Notification Listener Stopped (Logical)");
};