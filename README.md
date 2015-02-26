# Dropbox-Zendesk Integration

This app sends attachments from Zendesk tickets to Dropbox

### To Do

* Get all attachments **DONE**
* Store Bearer Token in localStorage **DONE**
* Make an API call to Dropbox using the Bearer Token to create a test file **DONE**
* Make an API call to Dropbox using the Bearer Token to upload one of the ticket attachments
* Store all attachments in localStorage (Not clear yet if this is worth doing)

### Demo

##### 1. Adding Attachments to a New Ticket

![](http://g.recordit.co/E3yeOdNfJW.gif)

##### 2. Adding Attachments to an Existing Ticket

![](http://g.recordit.co/GoWwho7s2j.gif)

##### 3. Sending files to Dropbox (Sign in to Dropbox required)

* **When no Bearer Token present in localStorage**

![](http://g.recordit.co/syLhoKSPTH.gif)

##### 4. Sending files to Dropbox (Currently signed in to Dropbox)

* **Bearer Token is present in localStorage**

![](http://g.recordit.co/F0gMWcq0p5.gif)