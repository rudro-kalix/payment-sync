// This service expects 'cordova-plugin-sms' to be installed in your Capacitor/Cordova app.
// Run: npm install cordova-plugin-sms
// Run: npx cap sync

let onSmsArriveHandler: ((e: any) => void) | null = null;

export const startSmsListener = (onSmsReceived: (smsBody: string) => void) => {
  try {
    const smsPlugin = (window as any).SMS;

    if (smsPlugin) {
      console.log("Starting Native SMS Listener...");
      
      // 0. Cleanup previous listeners if any (safety check)
      if (onSmsArriveHandler) {
        document.removeEventListener('onSMSArrive', onSmsArriveHandler);
      }

      // 1. Define and Attach Event Handler
      onSmsArriveHandler = (e: any) => {
        try {
          console.log("SMS Arrived Event Triggered");
          const sms = e.data;
          if (sms && sms.body) {
            console.log("SMS Body received:", sms.body);
            onSmsReceived(sms.body);
          }
        } catch (innerErr) {
          console.error("Error processing incoming SMS event:", innerErr);
        }
      };
      document.addEventListener('onSMSArrive', onSmsArriveHandler);

      // 2. Ensure Permissions and Start Watch
      smsPlugin.hasPermission((hasPermission: boolean) => {
        if (!hasPermission) {
          smsPlugin.requestPermission(() => {
            console.log("SMS Permission Granted");
            startWatching(smsPlugin);
          }, (err: any) => {
            console.error("SMS Permission Denied:", err);
            // Optional: alert user permission is needed
          });
        } else {
          startWatching(smsPlugin);
        }
      }, (err: any) => {
        console.error("Error checking SMS permissions:", err);
      });

    } else {
      console.warn("Native SMS plugin not found. This is expected in a browser.");
    }
  } catch (err) {
    console.error("CRITICAL: Error starting SMS listener:", err);
  }
};

const startWatching = (smsPlugin: any) => {
  smsPlugin.startWatch(
    () => {
      console.log("SMS Watch started successfully");
    },
    (err: any) => {
      console.error("Error starting SMS watch:", err);
    }
  );
};

export const stopSmsListener = () => {
  try {
    // 1. Remove Event Listener
    if (onSmsArriveHandler) {
      document.removeEventListener('onSMSArrive', onSmsArriveHandler);
      onSmsArriveHandler = null;
    }

    // 2. Stop Plugin Watch
    const smsPlugin = (window as any).SMS;
    if (smsPlugin) {
      smsPlugin.stopWatch(
        () => console.log("SMS Watch stopped"),
        () => {}
      );
    }
  } catch (err) {
    console.error("Error stopping SMS listener:", err);
  }
};