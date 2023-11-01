// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank" rel="noreferrer">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import { useState, useEffect, useRef } from 'react';
import Video from 'twilio-video';

function App() {
  const [roomName, setRoomName] = useState('');
  const [room, setRoom] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (room) {
      const handleConnectedParticipant = (participant) => {
        const participantDiv = document.createElement("div");
        participantDiv.setAttribute("id", participant.identity);
        containerRef.current.appendChild(participantDiv);
        
        participant.tracks.forEach((trackPublication) =>
          handleTrackPublication(trackPublication, participant)
        );
        
        participant.on("trackPublished", (trackPublication) =>
          handleTrackPublication(trackPublication, participant)
        );
      };

      handleConnectedParticipant(room.localParticipant);
      room.participants.forEach(handleConnectedParticipant);
      room.on("participantConnected", handleConnectedParticipant);
      room.on("participantDisconnected", handleDisconnectedParticipant);
      
      return () => {
        window.removeEventListener("pagehide", room.disconnect);
        window.removeEventListener("beforeunload", room.disconnect);
      };
    }
  }, [room]);

  const handleTrackPublication = (trackPublication, participant) => {
    const participantDiv = document.getElementById(participant.identity);
    if (trackPublication.track) {
      participantDiv.appendChild(trackPublication.track.attach());
    }

    trackPublication.on("subscribed", track => {
      participantDiv.appendChild(track.attach());
    });
  };

  const handleDisconnectedParticipant = (participant) => {
    participant.removeAllListeners();
    const participantDiv = document.getElementById(participant.identity);
    if (participantDiv) participantDiv.remove();
  };

  const joinVideoRoom = async (roomName, token) => {
    const room = await Video.connect(token, { room: roomName });
    setRoom(room);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("https://wholeimmaterialsuperuser.jayraval20.repl.co/join-room", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName }),
    });
    const { token } = await response.json();
    joinVideoRoom(roomName, token);
  };

  return (
    <div>
      {!room && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button type="submit">Join Room</button>
        </form>
      )}
      <div ref={containerRef}></div>
    </div>
  );
}

export default App;