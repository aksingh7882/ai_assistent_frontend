// import React, { useEffect, useState } from "react";
// import "./App.css";

// function App() {
//   const [status, setStatus] = useState("Checking Server...");
//   const [calls] = useState([
//     {
//       caller: "+91 98XXXXXX12",
//       status: "Completed",
//     },
//     {
//       caller: "+91 97XXXXXX45",
//       status: "Transferred to Human",
//     },
//   ]);

//   useEffect(() => {
//     fetch("http://localhost:3000/")
//       .then((res) => res.text())
//       .then((data) => {
//         setStatus(data);
//       })
//       .catch(() => {
//         setStatus("Server Offline");
//       });
//   }, []);

//   return (
//     <div className="container">
//       <h1>AI Call Assistant Dashboard</h1>

//       <div className="card">
//         <h2>Server Status</h2>
//         <p>{status}</p>
//       </div>

//       <div className="card">
//         <h2>Recent Calls</h2>

//         {calls.map((call, index) => (
//           <div className="call" key={index}>
//             <p>{call.caller}</p>
//             <span>{call.status}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;


import React, { useEffect, useState } from "react";
import axios from "axios";
import { Device } from "@twilio/voice-sdk";

import "./App.css";

function App() {
  const [device, setDevice] = useState(null);
  const [callStatus, setCallStatus] = useState("Idle");

  useEffect(() => {
    async function setupDevice() {
      try {
        const response = await axios.get(
          "https://voice-ai-assistent.onrender.com/token"
        );

        const newDevice = new Device(response.data.token, {
          codecPreferences: ["opus", "pcmu"],
        });

        newDevice.on("registered", () => {
          console.log("Twilio Device Ready");
        });

        newDevice.on("error", (error) => {
          console.log(error);
        });

        await newDevice.register();

        setDevice(newDevice);
      } catch (error) {
        console.log(error);
      }
    }

    setupDevice();
  }, []);

  // =========================
  // START CALL
  // =========================

  const makeCall = async () => {
    if (!device) return;

    try {
      setCallStatus("Calling...");

      const call = await device.connect();

      call.on("accept", () => {
        setCallStatus("Connected");
      });

      call.on("disconnect", () => {
        setCallStatus("Call Ended");
      });

    } catch (error) {
      console.log(error);
      setCallStatus("Failed");
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
      </div>
    </div>
  );
}

export default App;