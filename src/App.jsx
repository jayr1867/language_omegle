import React, { useState, useEffect, useRef } from "react";
import Video from "twilio-video";
import "./App.css";
import { useNavigate } from "react-router-dom";
import languagesData from './languages.json'


import * as io from "socket.io-client";


const sampleRate = 16000;

const getMediaStream = () =>
  navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: "default",
      sampleRate: sampleRate,
      sampleSize: 16,
      channelCount: 1,
    },
    video: false,
  });

function App() {
  const [roomName, setRoomName] = useState("");
  const [room, setRoom] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [receivedAudioText, setReceivedAudioText] = useState("");
  const containerRef = useRef(null);
  const attachedTracks = useRef(new Set()); 
  const navigate = useNavigate();

  const [connection, setConnection] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState();
  const processorRef = useRef();
  const audioContextRef = useRef();
  const audioInputRef = useRef();


  const connect = (requestBody) => {
    connection?.disconnect();
    const socket = io.connect("https://lang-server.onrender.com", { reconnection: false });
    socket.on("connect", () => {
      console.log("connected", socket.id);
      setConnection(socket);
    });

    console.log("request body", requestBody);

    socket.emit('query', requestBody);

    // socket.emit("send_message", "hello world");

    socket.emit("startGoogleCloudStream", requestBody);

    socket.on("receive_message", (data) => {
      console.log("received message", data);
    });

    socket.on("receive_audio_text", (data) => {
      // speechRecognized(data);
      console.log("received audio text", data);
      setReceivedAudioText(data.text);
    });

    socket.on("disconnect", (reason) => {

      if (reason !== "io server disconnect" && reason !== "io client disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        // connect(requestBody);
        alert("socket connection abruptyly disconnected, please try a different room");
        handleDisconnect();
        window.location.reload();
      }
      
      console.log("disconnected due to ", reason);
    });
  };

  const disconnect = () => {
    if (!connection) {
      
      return;
    } 
    connection?.emit("endGoogleCloudStream", roomName);
    connection?.disconnect();
    processorRef.current?.disconnect();
    audioInputRef.current?.disconnect();
    audioContextRef.current?.close();
    setConnection(undefined);
    setRecorder(undefined);
    setIsRecording(false);
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



  const handleTrackPublication = (trackPublication, participant) => {
    const participantDiv = document.getElementById(participant.identity);
    const trackId = trackPublication.trackSid;
    if (trackPublication.track && !attachedTracks.current.has(trackId)) {
      attachedTracks.current.add(trackId);
      const trackElement = trackPublication.track.attach();
      trackElement.dataset.trackId = trackId; 
      participantDiv.appendChild(trackElement);
    }

    trackPublication.on("subscribed", (track) => {
      const trackId = track.sid;
      if (!attachedTracks.current.has(trackId)) {
        attachedTracks.current.add(trackId);
        const trackElement = track.attach();
        trackElement.dataset.trackId = trackId;
        participantDiv.appendChild(trackElement);
      }
    });
  };

  const joinVideoRoom = async (roomName, token) => {
    const room = await Video.connect(token, { room: roomName });
    setRoom(room);
  };

  const handleSubmit = async (e) => {

    
    if (!selectedLanguage || !roomName) {
      alert('Please select a language and enter a room name.');
      return;
    }
    e.preventDefault();
    
    const requestBody = ({
      roomName: roomName,
      sttLang: selectedLanguage,
      transLang: selectedLanguage.split('-')[0],
    });

    console.log(roomName, selectedLanguage, selectedLanguage.split('-')[0]);

    connect(requestBody);

    // console.log(requestBody.sttLang);
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
      handleDisconnect();
      alert(err);
    }
  };

  const handleDisconnect = () => {
    disconnect();

    console.log("disconnecting");
    if (room) {
      // disconnect();
      room.disconnect();
    }
    setRoom(null);
    navigate("/");
    setRoomName("");
    window.location.reload();
  };

  useEffect(() => {
    setLanguages(languagesData);
    if (room) {
      const handleConnectedParticipant = (participant) => {
        let participantDiv = document.getElementById(participant.identity);

        if (!participantDiv) {
          // Create the participant div if it doesn't exist
          participantDiv = document.createElement("div");
          participantDiv.setAttribute("id", participant.identity);
          participantDiv.classList.add("participant");
          containerRef.current.appendChild(participantDiv);
        }
        
        // containerRef.current.appendChild(participantDiv);

        participant.tracks.forEach((trackPublication) =>
          handleTrackPublication(trackPublication, participant),
        );

        participant.on("trackPublished", (trackPublication) =>
          handleTrackPublication(trackPublication, participant),
        );
      };

      if (!document.getElementById(room.localParticipant.identity)) {
        handleConnectedParticipant(room.localParticipant);
      }
      room.participants.forEach(handleConnectedParticipant);
      room.on("participantConnected", handleConnectedParticipant);
      room.on("participantDisconnected", handleDisconnectedParticipant);


      (async () => {
        if (connection) {
          if (isRecording) {
            return;
          }

          const stream = await getMediaStream();

          audioContextRef.current = new window.AudioContext();

          await audioContextRef.current.audioWorklet.addModule(
            "/worklets/recorderWorkletProcessor.js"
          );

          audioContextRef.current.resume();

          audioInputRef.current =
            audioContextRef.current.createMediaStreamSource(stream);

          processorRef.current = new AudioWorkletNode(
            audioContextRef.current,
            "recorder.worklet"
          );

          processorRef.current.connect(audioContextRef.current.destination);
          audioContextRef.current.resume();

          audioInputRef.current.connect(processorRef.current);

          processorRef.current.port.onmessage = (event) => {
            const audioData = event.data;
            connection.emit("send_audio_data", { audio: audioData });
          };
          setIsRecording(true);
        } else {
          alert("No web socket connection made. Try again!");
          handleDisconnect();
          // room.disconnect();
          console.error("No connection");
        }
      })();

      return () => {
        window.removeEventListener("pagehide", room.disconnect);
        window.removeEventListener("beforeunload", room.disconnect);

        if (isRecording) {
          processorRef.current?.disconnect();
          audioInputRef.current?.disconnect();
          if (audioContextRef.current?.state !== "closed") {
            audioContextRef.current?.close();
          }
        }
      };
    }
  }, [room, isRecording, recorder, connection, handleDisconnectedParticipant]);

  // New useEffect for auto-scrolling captions
  useEffect(() => {
    const captionsContainer = document.querySelector('.captions-container');
    if (captionsContainer) {
      captionsContainer.scrollTop = captionsContainer.scrollHeight;
    }
  }, [receivedAudioText]);

  return (
    <div>
      {!room ? (
        <form onSubmit={handleSubmit}>
          <div className="instructions">
            <h4><b>READ BEFORE PROCEEDING:</b></h4>
            <ul>
              <li><strong>Please wait for a few seconds for the server to wake up after clicking the Join Room once.</strong></li>
              <li>Enter a room name you want to create/join, and hit the Join Room button. </li>
              <li>Switch to a different browser (or, send a link and the room name to a friend) and use the same<br></br> URL and enter the same room name, 
                for example: Room1, and join the room. You would see <br></br>two screens with two videos streaming at the same time.</li>
              <li><strong>Recommend:</strong> Use a different device for the 2nd &quot;participant&quot; as opening another window will interfere in audio</li>
              <li>You would see a translated transcription from the other user in the language you have selected. </li>
              <li>The other user will see a translated transcript in the language they have selected. </li>
              <li>If both the user has selected a language with different dialect (eg. English (US) and English (UK)), <br></br>you will simply get a transcription in the same language. (English in the case of the example)</li>
              <li>Make sure to speak in the language that you have selected for enhanced experience. </li>
              <li>If you do not see any text please wait for a few seconds and try talking again. Please speak clearly.</li>
            </ul>
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{ width: '100%', fontSize: '16px', padding: '10px' }}
          >
            <option value="">Select a language</option> {/* Default option */}
            {languages.map((lang, index) => (
              <option key={index} value={lang['BCP-47']}>{lang.Name}</option>
            ))}
          </select>
          <h3>Selecting the language that you speak</h3>
          <input
            type="text"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button type="submit">Join Room</button>
          
        </form>
      ) : (
        <div>
          <div ref={containerRef} className="container"></div>
          <div className="translucent-banner">
            <button className="disconnect-button" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
          <div className="received-audio-text">
            <h3>Translated Transcript:</h3>
            <p>{receivedAudioText}</p>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
