# Language Omegle

_**Talk to a random stranger who speaks a different language than you, in your own language.**_

## Group members

- Jay Raval
  - netID: jraval2
- Parth Tawde
  - netID: ptawde2

## [Github link](https://github.com/jayr1867/travel_management)

If you have a private repository, please add `kaytwo` and `sauravjoshi` as collaborators.

- public
  - Deployed [URL](https://language-omegle.onrender.com)

## What does your application do?

### Initial thoughts (plans)

- A place where a user could "video" chat with a stranger and not have to speak a common language to understand each other.
  - While person A speaks (for example) French and person B speaks Mandarin, they can understand each other using real-time subtitles while speaking their own language.
  - (Potential) Would also have an audio-only and/or a chat-only feature where they don't need to be connected using a video, but still get subtitles along with the "original" language audio/text.
- If a user doesn't want to have human interaction, at all, they would be able to "video call" an AI, which would reply to them based on what the conversion is, and the language the user selects (language other than what they speak,) or they could also just randomize the language of the AI.

## What makes it different than a CRUD app? I.e., what functionality does it provide that is not just a user interface layer on top of a database of user information,and the ability to view / add to / change that information?

### Potentially

- The app would let the user talk using a video service and when there is no human found, the app would connect it to an AI "video" that would respond to the user using chatgpt's response.

## What security and privacy concerns do you expect you (as developers) or your users to have with this application?

### Initial concerns

1. Security of the user's personal information (name, email, phone number, etc)- If we choose to store those.
2. Explicit/profanity while on video call.

### This repository

This repository has a package.json that functions as a blank shell that gets full credit if you turn it in to the gradescope autograder. We will not be using the autograder in any way to actually evaluate your project, it is just there to keep track of your initial submission.

We recommend that you use this repository for your final project code. This will allow you to ask questions on Piazza and get help from the TAs and instructors. Adding a real linter, type checker, etc, based on our other examples would be a good idea.
