import { useState, useEffect, useRef } from 'react';
import Video from 'twilio-video';
import './App.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const [roomName, setRoomName] = useState('');
  const [room, setRoom] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

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
    if (room.participants.size === 1) {
      const localContainer = document.getElementById(room.localParticipant.identity);
      if (localContainer) {
          localContainer.classList.remove("two-participants");
      }
    }
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
    joinVideoRoom(roomName, token);
    navigate(`/room/${roomName}`);
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