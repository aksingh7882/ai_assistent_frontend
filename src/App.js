import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Device } from "@twilio/voice-sdk";

import "./App.css";

function App() {
  const [callStatus, setCallStatus] = useState("Idle");

  const deviceRef = useRef(null);
  const activeCallRef = useRef(null);

  // =========================
  // FETCH TOKEN
  // =========================

  const fetchToken = async () => {
    const response = await axios.get(
      "https://voice-ai-assistent.onrender.com/token"
    );

    return response.data.token;
  };

  // =========================
  // SETUP DEVICE
  // =========================

  useEffect(() => {
    let mounted = true;

    const setupDevice = async () => {
      try {
        const token = await fetchToken();

        const device = new Device(token, {
          codecPreferences: ["opus", "pcmu"],

          // IMPORTANT
          edge: "roaming",

          // better debugging
          logLevel: 1,

          // prevents accidental disconnect
          closeProtection: true,
        });

        // =========================
        // REGISTERED
        // =========================

        device.on("registered", () => {
          console.log("Twilio Device Ready");
          setCallStatus("Ready");
        });

        // =========================
        // TOKEN EXPIRY
        // =========================

        device.on("tokenWillExpire", async () => {
          console.log("Refreshing token...");

          try {
            const newToken = await fetchToken();

            await device.updateToken(newToken);

            console.log("Token updated");
          } catch (err) {
            console.error("Token refresh failed", err);
          }
        });

        // =========================
        // OFFLINE
        // =========================

        device.on("offline", () => {
          console.log("Device Offline");
          setCallStatus("Offline");
        });

        // =========================
        // ERROR HANDLING
        // =========================

        device.on("error", (error) => {
          console.error("Twilio Error:", {
            code: error.code,
            message: error.message,
            causes: error.causes,
            solutions: error.solutions,
          });

          setCallStatus(`Error: ${error.code}`);

          // HANDLE 53000
          if (error.code === 53000) {
            console.log("Re-registering device...");

            device.register();
          }
        });

        // =========================
        // REGISTER DEVICE
        // =========================

        await device.register();

        if (mounted) {
          deviceRef.current = device;
        }
      } catch (error) {
        console.error("Setup Error:", error);
        setCallStatus("Setup Failed");
      }
    };

    setupDevice();

    // =========================
    // CLEANUP
    // =========================

    return () => {
      mounted = false;

      if (activeCallRef.current) {
        activeCallRef.current.disconnect();
      }

      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, []);

  // =========================
  // START CALL
  // =========================

  const makeCall = async () => {
    if (!deviceRef.current) {
      console.log("Device not ready");
      return;
    }

    try {
      setCallStatus("Calling...");

      const call = await deviceRef.current.connect();

      activeCallRef.current = call;

      // =========================
      // CALL ACCEPTED
      // =========================

      call.on("accept", () => {
        console.log("Call connected");
        setCallStatus("Connected");
      });

      // =========================
      // CALL DISCONNECTED
      // =========================

      call.on("disconnect", () => {
        console.log("Call disconnected");
        setCallStatus("Call Ended");
      });

      // =========================
      // CALL ERROR
      // =========================

      call.on("error", (err) => {
        console.error("Call Error:", err);

        setCallStatus("Call Failed");
      });

    } catch (error) {
      console.error("Connection Error:", error);

      setCallStatus("Connection Failed");
    }
  };

  // =========================
  // END CALL
  // =========================

  const endCall = () => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
    }
  };

  return (
    <div className="container">
      <h1>AI Call Assistant</h1>

      <div className="card">
        <h2>Status</h2>

        <p>{callStatus}</p>

        <button onClick={makeCall}>
          Call Now
        </button>

        <button onClick={endCall}>
          End Call
        </button>
      </div>
    </div>
  );
}

export default App;
