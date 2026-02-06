// This service expects 'cordova-plugin-sms' to be installed in your Capacitor/Cordova app.
// Run: npm install cordova-plugin-sms
// Run: npx cap sync

export const startSmsListener = (onSmsReceived: (smsBody: string) => void) => {
  const smsPlugin = (window as any).SMS;

  if (smsPlugin) {
    console.log("Starting Native SMS Listener...");
    
    // 1. Ensure Permissions (Best practice for Android)
    smsPlugin.hasPermission((hasPermission: boolean) => {
      if (!hasPermission) {
        smsPlugin.requestPermission(() => {
          console.log("SMS Permission Granted");
          startWatching(smsPlugin, onSmsReceived);
        }, (err: any) => {
          console.error("SMS Permission Denied:", err);
        });
      } else {
        startWatching(smsPlugin, onSmsReceived);
      }
    }, (err: any) => {
      console.error("Error checking SMS permissions:", err);
    });

    // 2. Global Event Listener for Incoming SMS
    // The plugin fires 'onSMSArrive' on the document
    document.addEventListener('onSMSArrive', (e: any) => {
      console.log("SMS Arrived Event Triggered");
      const sms = e.data;
      if (sms && sms.body) {
        console.log("SMS Body received:", sms.body);
        onSmsReceived(sms.body);
      }
    });

  } else {
    console.warn("Native SMS plugin not found. This is expected in a browser. Run on a device to test real SMS.");
  }
};

const startWatching = (smsPlugin: any, callback: any) => {
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
  const smsPlugin = (window as any).SMS;
  if (smsPlugin) {
    smsPlugin.stopWatch(
      () => console.log("SMS Watch stopped"),
      () => {}
    );
  }
};