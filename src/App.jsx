import React, { useState, useEffect, useRef } from "react";
import Video from "twilio-video";
import "./App.css";
import { useNavigate } from "react-router-dom";
import languagesData from './languages.json';
import io from "socket.io-client";

// import WebSocket from "ws";



function App() {
  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const [languages, setLanguages] = useState(languagesData);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [connection, setConnection] = useState(null);
  const audioContextRef = useRef(null);
  const audioInputRef = useRef(null);

  // let ws;

  // // Web Audio API context
  // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  useEffect(() => {
    const newSocket = io("http://localhost:5050");
    setConnection(newSocket);

    newSocket.on("connect", () => console.log("Connected to Socket.io server"));
    newSocket.on("disconnect", () => console.log("Disconnected from Socket.io server"));

    return () => newSocket.close();
  }, []);

  const processAudioStream = (audioStream) => {
    audioContextRef.current = new window.AudioContext();
    audioInputRef.current = audioContextRef.current.createMediaStreamSource(audioStream);

    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (connection && connection.connected) {
        const audioData = e.inputBuffer.getChannelData(0);
        connection.emit("send_audio_data", audioData.buffer);
      }
    };

    audioInputRef.current.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };




  const handleConnectedParticipant = (participant) => {
    const participantDiv = document.createElement("div");
    participantDiv.setAttribute("id", participant.identity);
    participantDiv.classList.add("participant");
    containerRef.current.appendChild(participantDiv);

    participant.tracks.forEach((trackPublication) =>
      handleTrackPublication(trackPublication, participant),
    );

    participant.on("trackPublished", (trackPublication) =>
      handleTrackPublication(trackPublication, participant),
    );

    extractAudioStream(participant);  // Extract and process audio stream for the connected participant
  };

    // Function to extract audio stream from a participant
    const extractAudioStream = (participant) => {
      const audioTrack = Array.from(participant.audioTracks.values())[0]?.track;
      if (audioTrack) {
        const audioStream = new MediaStream([audioTrack.mediaStreamTrack]);
        processAudioStream(audioStream);
      }
    };

  // Handle the publication of each track
  const handleTrackPublication = (trackPublication, participant) => {
    const participantDiv = document.getElementById(participant.identity);
    if (trackPublication.track) {
      participantDiv.appendChild(trackPublication.track.attach());
    }

    trackPublication.on("subscribed", (track) => {
      participantDiv.appendChild(track.attach());
      if (track.kind === "audio") {
        extractAudioStream(participant);  // Extract and process the audio stream
      }
    });
  };

  const handleDisconnectedParticipant = React.useCallback(
    (participant) => {
      participant.removeAllListeners();
      const participantDiv = document.getElementById(participant.identity);
      if (participantDiv) participantDiv.remove();
      if (room.participants.size === 1) {
        const localContainer = document.getElementById(
          room.localParticipant.identity,
        );
        if (localContainer) {
          localContainer.classList.remove("two-participants");
        }
      }
    },
    [room],
  );

  useEffect(() => {
    setLanguages(languagesData);


    if (room) {
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

  const joinVideoRoom = async (roomName, token) => {
    const room = await Video.connect(token, { room: roomName });
    setRoom(room);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLanguage || !roomName) {
      alert('Please select a language and enter a room name.');
      return;
    }

    const requestBody = {
      roomName,
      language: selectedLanguage,
    };

    try {
    const response = await fetch("https://lang-server.onrender.com/join-room", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify( requestBody ),
    });
    const { token } = await response.json();
      await joinVideoRoom(roomName, token);
      navigate(`/room/${roomName}`);
    } catch (err) {
      alert(err);
    }
  };

  const handleDisconnect = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (room) {
      room.disconnect();
    }
    setRoom(null);
    navigate("/");
    setRoomName("");
  };

  return (
    <div>
      {!room ? (
        <form onSubmit={handleSubmit}>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{ width: '100%', fontSize: '16px', padding: '10px' }}
          >
            <option value="">Select a language</option>
            {languages.map((lang, index) => (
              <option key={index} value={lang['BCP-47']}>{lang.Name}</option>
            ))}
          </select>
          <h3>Select a Language Before You Proceed</h3>
          <input
            type="text"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button type="submit" disabled={!selectedLanguage || !roomName}>Join Room</button>
          <div className="instructions">
            <h4><b>MVP</b></h4>
            <ul>
              <li><strong>Please wait for a few seconds for the server to wake up after clicking the Join Room once.</strong></li>
              <li>Enter a room name you want to create/join, and hit the Join Room button. </li>
              <li>Switch to a different browser (or, send a link and the room name to a friend) and use the same<br></br> URL and enter the same room name, 
                for example: Room1, and join the room. You would see <br></br>two screens with two videos streaming at the same time.</li>
              <li>There is a disconnect button for you to disconnect from the live video streaming.</li>
              <li>There could only be at max two participants in a room, since we want to make it like Omegle.</li>
            </ul>
          </div>
        </form>
      ) : (
        <div>
          <div ref={containerRef} className="container"></div>
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
