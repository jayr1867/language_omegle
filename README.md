# Language Omegle

_**Talk to a random stranger who speaks a different language than you, in your own language.**_

## Group members

- Jay Raval
  - netID: jraval2
- Parth Tawde
  - netID: ptawde2

## [Github link](https://github.com/jayr1867/language_omegle)

If you have a private repository, please add `kaytwo` and `sauravjoshi` as collaborators.

- public
  - Deployed [URL](https://language-omegle.onrender.com)

### Server

Using a NodeJS app with Express and Socket.IO.
Manages the transaction for access token to Twilio Video API, and also transcripts, and translates the user audio using Google Speech-to-Text and Cloud Translate APIs respectively.

- public
  - Deployed on `https://lang-server.onrender.com` with only one endpoint, `/join-room`, for now.
  - For more details, please visit the repo [here](https://github.com/jayr1867/language_omegle_server).

## How to use this application?

### READ BEFORE PROCEEDING:

- Please wait for a few seconds for the server to wake up after clicking the Join Room once.
- Enter a room name you want to create/join, and hit the Join Room button.
- Switch to a different browser (or, send a link and the room name to a friend) and use the same URL and enter the same room name, for example: Room1, and join the room. You would see two screens with two videos streaming at the same time.
- **Recommend:** Use a different device for the 2nd &quot;participant&quot; as opening another window will interfere in audio
- You would see a translated transcription from the other user in the language you have selected.
- The other user will see a translated transcript in the language they have selected.
- If both the user has selected a language with different dialect (eg. English (US) and English (UK)), you will simply get a transcription in the same language. (English in the case of the example)
- Make sure to speak in the language that you have selected for enhanced experience.
- If you do not see any text please wait for a few seconds and try talking again. Please speak clearly.

## What does your application do?

- An application that provides video calling option for people who want to talk to other people but don't speak the same language.
- App gets the audio transcription and translates it to the language you speak. Does the same for the other person.

## What makes it different than a CRUD app? I.e., what functionality does it provide that is not just a user interface layer on top of a database of user information,and the ability to view / add to / change that information?

- Being able to get the audio, transcripting it, and translating it and displaying it to the other person in real-time.

## What security and privacy concerns do you expect you (as developers) or your users to have with this application?

1. People sharing the room name to anyone could potentially have them with someone they might not want to be. They could just disconnet if that happens.
2. The APIs get attacked and become vulnerable to data leakage.

### This repository

This repository has a package.json that functions as a blank shell that gets full credit if you turn it in to the gradescope autograder. We will not be using the autograder in any way to actually evaluate your project, it is just there to keep track of your initial submission.

We recommend that you use this repository for your final project code. This will allow you to ask questions on Piazza and get help from the TAs and instructors. Adding a real linter, type checker, etc, based on our other examples would be a good idea.
