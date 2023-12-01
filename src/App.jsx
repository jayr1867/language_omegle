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
  const containerRef = useRef(null);
  const navigate = useNavigate();
  

  // const [currentRecognition, setCurrentRecognition] = useState();
  // const [recognitionHistory, setRecognitionHistory] = useState([]);
  const [connection, setConnection] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState();
  const processorRef = useRef();
  const audioContextRef = useRef();
  const audioInputRef = useRef();

  // const [requestBody, setRequestBody] = useState({});


  const connect = (requestBody) => {
    connection?.disconnect();
    const socket = io.connect("http://localhost:5000");
    socket.on("connect", () => {
      console.log("connected", socket.id);
      setConnection(socket);
    });

    console.log("request body", requestBody);

    socket.emit('query', requestBody);

    socket.emit("send_message", "hello world");

    socket.emit("startGoogleCloudStream", requestBody);

    socket.on("receive_message", (data) => {
      console.log("received message", data);
    });

    socket.on("receive_audio_text", (data) => {
      // speechRecognized(data);
      console.log("received audio text", data);
    });

    socket.on("disconnect", () => {
      console.log("disconnected");
    });
  };

  const disconnect = () => {
    if (!connection) {
      alert("No web socket connection, cannot connect to the room!");
      room.disconnect();
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

  useEffect(() => {
    setLanguages(languagesData);
    if (room) {
      const handleConnectedParticipant = (participant) => {
        const participantDiv = document.createElement("div");
        participantDiv.setAttribute("id", participant.identity);
        participantDiv.classList.add("participant");
        containerRef.current.appendChild(participantDiv);
        // containerRef.current.appendChild(participantDiv);

        participant.tracks.forEach((trackPublication) =>
          handleTrackPublication(trackPublication, participant),
        );

        participant.on("trackPublished", (trackPublication) =>
          handleTrackPublication(trackPublication, participant),
        );
      };

      handleConnectedParticipant(room.localParticipant);
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
            "/src/worklets/recorderWorkletProcessor.js"
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
          // handleDisconnect();
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

  const handleTrackPublication = (trackPublication, participant) => {
    const participantDiv = document.getElementById(participant.identity);
    if (trackPublication.track) {
      participantDiv.appendChild(trackPublication.track.attach());
    }

    trackPublication.on("subscribed", (track) => {
      participantDiv.appendChild(track.attach());
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
      alert(err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    console.log("disconnecting");
    room.disconnect();
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
            <option value="">Select a language</option> {/* Default option */}
            <option value="">Select a language</option>
            {languages.map((lang, index) => (
              <option key={index} value={lang['BCP-47']}>{lang.Name}</option>
            ))}
          </select>
          <h3>Select the language before proceeding</h3>
          <input
            type="text"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button type="submit">Join Room</button>
          <p className="instructions">
            <h4><b>MVP</b></h4>
            <ul>
              <li><strong>Please wait for a few seconds for the server to wake up after clicking the Join Room once.</strong></li>
              <li>Enter a room name you want to create/join, and hit the Join Room button. </li>
              <li>Switch to a different browser (or, send a link and the room name to a friend) and use the same<br></br> URL and enter the same room name, 
                for example: Room1, and join the room. You would see <br></br>two screens with two videos streaming at the same time.</li>
              <li>There is a disconnect button for you to disconnect from the live video streaming.</li>
              <li>There could only be at max two participants in a room, since we want to make it like Omegle.</li>
            </ul>
          </p>
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
