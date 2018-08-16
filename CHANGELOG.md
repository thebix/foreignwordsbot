## 0.2.3 (August 16, 2018)
  - added max count of right answers

## 0.2.2 (July 03, 2018)
  - fixed empty word translations crash

## 0.2.1 (May 25, 2018)
  - added percentage statistics
  - don't get card on timer if last command is getCard or bot is waiting for user response
  - added space separation for translations on 'user don't know' button
  - added inline button 'More' to get another card

## 0.2.0 (May 13, 2018)
  - changed line logic: dontknow - 4 back, right => rightsCombo * 7 back
  - added /stat command and daily report
  - added analytics logger
  - added history module
  - refactored storage to storage + state classes, storage now operates with different files by users
  - added getlist and remove commands, lowercase search, subscribeOn, fixed stop
  - fixed add card split result check condition

## 0.0.1 (May 09, 2018)
  - Base: flash card, by timer, add flash card, flash card list, remove words

