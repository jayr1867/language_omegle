# Travel Manager- Trip Expense Tracking and More

# Jay Raval- jraval2@uic.edu (solo)

# [Github link](https://github.com/jayr1867/travel_management)
If you have a private repository, please add `kaytwo` and `sauravjoshi` as collaborators.

## What does your application do?

### Initial thoughts (plans)

* A trip expense tracker that lets use create a "trip" and create an itenerary and manage expenses for a trip.
  * Users would be able split and share the expense (and/or the whole "trip") with others as a group, know who owes who how much money, and be able to pay using paypal or venmo.
  * User can also create a "diary" that they could use a journal to write and upload photos/videos as a memory of the trip.

## What makes it different than a CRUD app? I.e., what functionality does it provide that is not just a user interface layer on top of a database of user information,and the ability to view / add to / change that information?

The app will have a group collaboration and real time sharing of expenses and trip details, including payment options to payout/request their expense logs. Also, if traveling international, the app will have a currency converter to help users keep track of their expenses in their home currency.

## What security and privacy concerns do you expect you (as developers) or your users to have with this application?

### Initial concerns

1. Security of the user's personal information (name, email, phone number, etc)
2. Properly implementing payment APIs (paypal, venmo, etc) to ensure that the user's payment information is secure.
3. Users adding someone they don't intend to add to their trip by mistake.

### This repository

This repository has a package.json that functions as a blank shell that gets full credit if you turn it in to the gradescope autograder. We will not be using the autograder in any way to actually evaluate your project, it is just there to keep track of your initial submission.

We recommend that you use this repository for your final project code. This will allow you to ask questions on Piazza and get help from the TAs and instructors. Adding a real linter, type checker, etc, based on our other examples would be a good idea.
