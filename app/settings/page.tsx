"use client";

import React, { useEffect, useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Key, 
  Send, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Info, 
  Copy, 
  Check, 
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  // VAPID key check/generation state
  const [vapidPublicKey, setVapidPublicKey] = useState<string>("");
  const [isGeneratingVapid, setIsGeneratingVapid] = useState(false);
  const [generatedVapid, setGeneratedVapid] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test Notification state
  const [testTitle, setTestTitle] = useState("Hello from Resiliessance! 👋");
  const [testBody, setTestBody] = useState("Web Push is working perfectly on your iPhone!");
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    // Set default device name based on user agent on client side
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      if (/iPhone/.test(ua)) setDeviceName("iPhone");
      else if (/iPad/.test(ua)) setDeviceName("iPad");
      else if (/Macintosh/.test(ua)) setDeviceName("Mac");
      else if (/Android/.test(ua)) setDeviceName("Android Device");
      else setDeviceName("Desktop Browser");
    }

    // Fetch VAPID public key dynamically from the server at runtime
    const fetchVapidKey = async () => {
      try {
        const res = await fetch("/api/push/config");
        const data = await res.json();
        if (data.publicKey) {
          setVapidPublicKey(data.publicKey);
        }
      } catch (err) {
        console.error("Error fetching VAPID key dynamically:", err);
      }
    };
    fetchVapidKey();
  }, []);

  useEffect(() => {
    const checkSupportAndSubscription = async () => {
      setIsLoading(true);
      
      const supported = 
        typeof window !== "undefined" && 
        "serviceWorker" in navigator && 
        "PushManager" in window;
      
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        try {
          // Register SW to verify active registration
          const registration = await navigator.serviceWorker.register("/sw.js");
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            setSubscription(sub);
            setIsSubscribed(true);
          } else {
            setSubscription(null);
            setIsSubscribed(false);
          }
        } catch (err) {
          console.error("Error checking push subscription:", err);
        }
      }
      setIsLoading(false);
    };

    checkSupportAndSubscription();
  }, []);

  // Helper: Convert Base64 URL VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribe = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    try {
      // 1. Request Permission (must be triggered by direct user gesture on iOS)
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status !== "granted") {
        toast.error("Notification permission denied. Please reset permissions in your settings.");
        setIsLoading(false);
        return;
      }

      // 2. Fetch VAPID public key
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || vapidPublicKey;
      if (!publicKey) {
        toast.error("VAPID Public Key is not configured. Generate one below first.");
        setIsLoading(false);
        return;
      }

      // 3. Register SW (if not active already)
      const registration = await navigator.serviceWorker.ready;
      
      // 4. Subscribe to Push Manager
      const options = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      };

      const newSub = await registration.pushManager.subscribe(options);
      setSubscription(newSub);
      setIsSubscribed(true);

      // 5. Send subscription to our server/database
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: newSub,
          deviceName: deviceName || "Unknown Device",
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to register subscription on server");

      toast.success("Successfully registered for push notifications! 🎉");
    } catch (err: any) {
      console.error("Subscription failed:", err);
      toast.error(`Subscription failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;
    
    setIsLoading(true);
    try {
      // 1. Unsubscribe from Push Manager
      await subscription.unsubscribe();
      
      // 2. Call backend to remove endpoint
      const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to remove subscription from database");
      }

      setSubscription(null);
      setIsSubscribed(false);
      toast.success("Push notifications disabled.");
    } catch (err: any) {
      console.error("Unsubscription failed:", err);
      toast.error(`Failed to unsubscribe: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!isSubscribed || !subscription) {
      toast.error("Subscribe first before sending a test notification!");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          title: testTitle,
          messageBody: testBody,
          url: "/settings",
          tag: "settings-test",
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to send notification");

      toast.success("Test notification request sent! It should arrive shortly. 📲");
    } catch (err: any) {
      console.error("Test send failed:", err);
      toast.error(`Notification failed: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const generateVapidKeys = async () => {
    setIsGeneratingVapid(true);
    try {
      const res = await fetch("/api/generate-vapid");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate keys");
      setGeneratedVapid(data);
      toast.success("New VAPID Keys generated!");
    } catch (err: any) {
      toast.error(`Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingVapid(false);
    }
  };

  const copyToClipboard = (text: string, type: "public" | "private") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    toast.success(`${type === "public" ? "Public" : "Private"} key copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto space-y-6 pb-12 px-4">
        {/* Header Block */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Smartphone className="text-primary" size={24} />
            System Settings
          </h1>
          <p className="text-xs font-bold text-muted-foreground/60 mt-1">
            Configure PWA notifications, database hooks, and system properties.
          </p>
        </div>

        {/* 1. iOS installation Help Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Info className="text-sky-500" size={18} />
            <h2 className="text-sm font-black uppercase tracking-wider text-card-foreground">
              iOS PWA Setup Guide
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Apple requires you to add this website to your Home Screen as an App before you can subscribe to push notifications.
          </p>
          <div className="space-y-2.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-muted text-foreground font-black rounded-md w-5 h-5 shrink-0">1</span>
              <span>Open this site in the **Safari browser** on your iPhone.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-muted text-foreground font-black rounded-md w-5 h-5 shrink-0">2</span>
              <span>Tap the **Share** button <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-black border border-border/30">Share ⎙</span> at the bottom of Safari.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-muted text-foreground font-black rounded-md w-5 h-5 shrink-0">3</span>
              <span>Scroll down and select **"Add to Home Screen"**.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-muted text-foreground font-black rounded-md w-5 h-5 shrink-0">4</span>
              <span>Close Safari, open the **Resiliessance** app from your home screen, and subscribe below.</span>
            </div>
          </div>
        </div>

        {/* 2. Notification Toggle Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Bell className="text-primary" size={18} />
              <h2 className="text-sm font-black uppercase tracking-wider text-card-foreground">
                Push Notifications
              </h2>
            </div>
            {isLoading && <RefreshCw size={14} className="animate-spin text-muted-foreground" />}
          </div>

          {/* Status grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-muted/30 border border-border/10 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-wider">Device Support</span>
              <div className="flex items-center gap-1.5 font-bold mt-1">
                {isSupported === null ? (
                  <span className="text-muted-foreground">Checking...</span>
                ) : isSupported ? (
                  <>
                    <CheckCircle className="text-emerald-500" size={14} />
                    <span className="text-emerald-500">Supported</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-rose-500" size={14} />
                    <span className="text-rose-500">Unsupported</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-muted/30 border border-border/10 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-wider">iOS Permission</span>
              <div className="flex items-center gap-1.5 font-bold mt-1">
                {permission === null ? (
                  <span className="text-muted-foreground">Unknown</span>
                ) : permission === "granted" ? (
                  <>
                    <CheckCircle className="text-emerald-500" size={14} />
                    <span className="text-emerald-500">Allowed</span>
                  </>
                ) : permission === "denied" ? (
                  <>
                    <XCircle className="text-rose-500" size={14} />
                    <span className="text-rose-500">Blocked</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="text-amber-500" size={14} />
                    <span className="text-amber-500">Not Requested</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Subscribe Toggle Button */}
          {isSupported && (
            <div className="pt-2">
              {isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle size={16} /> Device is Subscribed to Push
                    </span>
                    <button 
                      onClick={handleUnsubscribe}
                      disabled={isLoading}
                      className="text-[10px] font-black tracking-wider uppercase bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 rounded-lg transition"
                    >
                      Disable
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading || !vapidPublicKey}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-black text-xs tracking-wider uppercase py-3 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 transition"
                >
                  <Bell size={15} />
                  Enable Push Notifications
                </button>
              )}
              {!vapidPublicKey && (
                <p className="text-[10px] font-bold text-rose-500 mt-2 text-center">
                  ⚠️ Environment Key (VAPID Public Key) is missing. Generate & configure keys below.
                </p>
              )}
            </div>
          )}

          {!isSupported && isSupported !== null && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-xs leading-relaxed space-y-1">
              <p className="font-black">Why is Push Notifications Unsupported?</p>
              <p className="text-muted-foreground">
                1. If you are on an iPhone, you must use Safari to **"Add to Home Screen"** and open the app from the Home Screen.
                2. On desktop, ensure you are using a modern browser (Chrome, Safari, Firefox) and serving the site over secure HTTPS.
              </p>
            </div>
          )}
        </div>

        {/* 3. Send Test Notification Console */}
        {isSubscribed && (
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <Send className="text-primary" size={18} />
              <h2 className="text-sm font-black uppercase tracking-wider text-card-foreground">
                Test Push Notification
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Device Custom Label</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. My iPhone 15"
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/45 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Notification Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/45 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">Notification Body</label>
                <textarea
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/45 font-bold resize-none"
                />
              </div>

              <button
                onClick={handleSendTestNotification}
                disabled={isSendingTest}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs tracking-wider uppercase py-2.5 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {isSendingTest ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                Send Test Push to this iPhone
              </button>
            </div>
          </div>
        )}

        {/* 4. VAPID Key Generator */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Key className="text-primary" size={18} />
            <h2 className="text-sm font-black uppercase tracking-wider text-card-foreground">
              VAPID Keys Management
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Web push subscriptions are signed with a public VAPID key and decrypted on the server with a private key. Use this generator to create keys if they aren't configured yet.
          </p>

          <button
            onClick={generateVapidKeys}
            disabled={isGeneratingVapid}
            className="bg-muted hover:bg-muted/80 text-foreground font-black text-xs tracking-wider uppercase px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            {isGeneratingVapid ? <RefreshCw className="animate-spin" size={14} /> : <Key size={14} />}
            Generate New Keypair
          </button>

          {generatedVapid && (
            <div className="space-y-3 bg-muted/30 border border-border/10 rounded-xl p-3.5 mt-3 text-xs">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY)</span>
                <div className="flex items-center gap-2 bg-card border border-border/30 rounded-lg p-2 font-mono text-[9px] select-all break-all relative">
                  <span className="flex-1">{generatedVapid.publicKey}</span>
                  <button 
                    onClick={() => copyToClipboard(generatedVapid.publicKey, "public")}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground shrink-0 transition"
                  >
                    {copiedKey === "public" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">Private Key (VAPID_PRIVATE_KEY)</span>
                <div className="flex items-center gap-2 bg-card border border-border/30 rounded-lg p-2 font-mono text-[9px] select-all break-all relative">
                  <span className="flex-1">{generatedVapid.privateKey}</span>
                  <button 
                    onClick={() => copyToClipboard(generatedVapid.privateKey, "private")}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground shrink-0 transition"
                  >
                    {copiedKey === "private" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500/90 rounded-xl p-3 text-[11px] leading-relaxed font-bold">
                ⚠️ **Next Action Required:** Add these environment variables to your `.env.local` file (and rebuild/deploy your app) so that the push notification server can start using them.
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
