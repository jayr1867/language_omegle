import React, { useState, useEffect, useRef } from "react";
import Video from "twilio-video";
import "./App.css";
import { useNavigate } from "react-router-dom";

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


  const connect = () => {
    connection?.disconnect();
    const socket = io.connect("http://localhost:5000");
    socket.on("connect", () => {
      console.log("connected", socket.id);
      setConnection(socket);
    });

    socket.emit("send_message", "hello world");

    socket.emit("startGoogleCloudStream");

    socket.on("receive_message", (data) => {
      console.log("received message", data);
    });

    socket.on("receive_audio_text", (data) => {
      // speechRecognized(data);
      console.log("received audio text", data);
    });

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
    });
  };

  const disconnect = () => {
    if (!connection) return;
    connection?.emit("endGoogleCloudStream");
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

    connect();
    e.preventDefault();
    const response = await fetch("http://127.0.0.1:5000/join-room", {
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
          <button type="submit" disabled={isRecording}>Join Room</button>
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
