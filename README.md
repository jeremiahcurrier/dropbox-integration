# Dropbox-Zendesk Integration

This app sends attachments from Zendesk tickets to Dropbox. 

Currently the app works only with PDFs. More options available in future version.

### Settings

1. **overwrite**
 * This value, either true (default) or false, determines whether an existing file will be overwritten by this upload. If true, any existing file will be overwritten. If false, the other parameters determine whether a conflict occurs and how that conflict is resolved

2. **filePath**
 * The path you want to save PDFs in Dropbox. Default is 'ZENDESK/pdf' - if you use the default please ensure there is already a root folder titled, 'ZENDESK', with a subfolder titled, 'pdf'

##### 1. When signed in to Dropbox

![](http://g.recordit.co/1sjJw3F2g1.gif)

##### 2. When not signed in to Dropbox

![](http://g.recordit.co/sxttJsEq5o.gif)

##### Demo

![](http://g.recordit.co/q8vHtW2rRG.gif)
