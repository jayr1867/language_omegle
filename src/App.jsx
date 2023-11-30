import React, { useState, useEffect, useRef } from "react";
import Video from "twilio-video";
import "./App.css";
import { useNavigate } from "react-router-dom";
// import WebSocket from "ws";



function App() {
  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  let ws;

  // Web Audio API context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const processAudioStream = (audioStream) => {
     ws = new WebSocket("ws://localhost:5000");
    const source = audioContext.createMediaStreamSource(audioStream);

    // Create an AnalyserNode
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Size of the FFT for frequency-domain analysis

    // Connect the source to the analyser
    source.connect(analyser);

    // Buffer to store data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Function to get audio data
    const getAudioData = () => {
      analyser.getByteFrequencyData(dataArray);
      // Here you can use dataArray for further processing
      // console.log(dataArray);// Example of logging the frequency data
      if (ws.readyState === 1){
        ws.send(JSON.stringify({ audioData: Array.from(dataArray) }));

        // ws.addEventListener("message", (event) => {
        //   console.log(event.data);
        // });
      }


      // console.log(ws.readyState);
      ws.error = (err) => {
        alert(err);
      }
      
    };

    // Call getAudioData periodically
    if (audioStream){
      setInterval(getAudioData, 100);
    }
  };

  // Function to extract audio stream from a participant
  const extractAudioStream = (participant) => {
    const audioTrack = Array.from(participant.audioTracks.values())[0]?.track;
    let audioStream;
    if (audioTrack) {
      audioStream = new MediaStream([audioTrack.mediaStreamTrack]);
      processAudioStream(audioStream);
    }
    return audioStream;
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
    const response = await fetch("https://lang-server.onrender.com/join-room", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName }),
    });
    const { token } = await response.json();
    try {
      await joinVideoRoom(roomName, token);
      navigate(`/room/${roomName}`);
    } catch (err) {
      alert(err);
    }
  };

  const handleDisconnect = () => {
    ws.close();
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
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button type="submit">Join Room</button>
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
