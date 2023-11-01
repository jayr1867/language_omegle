import React, { useState, useEffect, useRef } from 'react';
import Video from 'twilio-video';
import './App.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const [roomName, setRoomName] = useState('');
  const [room, setRoom] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const handleDisconnectedParticipant = React.useCallback((participant) => {
    participant.removeAllListeners();
    const participantDiv = document.getElementById(participant.identity);
    if (participantDiv) participantDiv.remove();
    if (room.participants.size === 1) {
      const localContainer = document.getElementById(room.localParticipant.identity);
      if (localContainer) {
          localContainer.classList.remove("two-participants");
      }
    }
  }, [room]);

  useEffect(() => {
    if (room) {
      const handleConnectedParticipant = (participant) => {
        const participantDiv = document.createElement("div");
        participantDiv.setAttribute("id", participant.identity);
        participantDiv.classList.add("participant");
        containerRef.current.appendChild(participantDiv);
        // containerRef.current.appendChild(participantDiv);
        
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
  }, [room, handleDisconnectedParticipant]);

  const handleTrackPublication = (trackPublication, participant) => {
    const participantDiv = document.getElementById(participant.identity);
    if (trackPublication.track) {
      participantDiv.appendChild(trackPublication.track.attach());
    }

    trackPublication.on("subscribed", track => {
      participantDiv.appendChild(track.attach());
    });
  };



  const joinVideoRoom = async (roomName, token) => {
    const room = await Video.connect(token, { room: roomName });
    setRoom(room);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("https://lang-server.onrender.com/join-room", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName }),
    });
    const { token } = await response.json();
    try {
      await joinVideoRoom(roomName, token);
      navigate(`/room/${roomName}`);
    }
    catch (err) {
      alert(err);
    }
  };

const handleDisconnect = () => {
    room.disconnect();
    setRoom(null);
    navigate("/");
    setRoomName("");
};


return (
  <div>
    {!room ? (
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button type="submit">Join Room</button>
        <p className="instructions">
          MVP: <br></br>Enter a room name and hit the Join Room button. 
          Switch to a different browser (or, send a link and the room name to friend) and use the same URL and enter the same room name, 
          for example: Room1, and join the room. You would see two screens with two videos streaming at the same time. 
          There is a disconnect button for you to disconnect from the live video streaming.
          <br></br>
          There could only be at max two participants in a room, since we want to make it like Omegle.
        </p>
      </form>
      
    ) : (
      <div>
        <div ref={containerRef} className='container'></div>
        <div className="translucent-banner">
          <button className="disconnect-button" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </div>
    )}
  </div>
);
}

export default App;