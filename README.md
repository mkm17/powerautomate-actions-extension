#Power Automate Actions Chrome Extension

The tool can be used for the following purposes:

## **1. Making SharePoint HTTP Requests and MS Graph HTTP Requests actions.**
With the tool you can record the following actions:

 **Default Requests invoked from SharePoint Page**

![Recorded Actions](/images/powerAutomateExtention/RecordDefaultSPActions.gif)


 **Requests invoked from browser console**

![Recorded Actions](/images/powerAutomateExtention/RecordConsoleAction.gif)


 **Requests invoked from SP Editor**

![Recorded Actions](/images/powerAutomateExtention/RecordActionsFromSPEditor.gif)

<br />
<br />

## **2.	Copy actions between two different environments**
With the tool, we can copy all actions from “My Clipboard” section and then past selected actions to the next environment.


![Copy Actions Between Environments](/images/powerAutomateExtention/CopyBetweenEnvs.gif)

<br />
<br />

## **3.	Copy entire action from community blogs.**
It is possible to copy all actions stored on the page as well as a single action using copy button. Please check [our article about bulb presence](https://michalkornet.com/2023/04/25/Bulb_Presence.html) as the reference. 

![Copy Actions from blog](/images/powerAutomateExtention/CopyItemsFromBlogAndSaveOnFlow.gif)

<br />
<br />

## **4.	Store actions in a more persistent way.**
Copy actions from My *Clipboard Section*.

[Copy Actions from My Clipboard](/images/powerAutomateExtention/CopyMyClipboardActions.gif)

<br />
<br />

All actions can be copied to My Clipboard section of Power Automate.

![Paste Actions to my clipboard](/images/powerAutomateExtention/CopyItemsToMyClipboard.gif)

<br />
<br />

 **How to install the tool?**

Currently, the tool is not available from Chrome Store. So, you need to install it manually.
To do so please unpack *[ApplicationBuild](https://github.com/mkm17/powerautomate-actions-extension/blob/main/ApplicationBuild.zip)* zip file and follow the steps described [here](https://support.google.com/chrome/a/answer/2714278?hl=en) to install the package locally. 

In the future, I will update this article with the link to Chrome Store.



## Available Scripts

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

The solution uses [craco](https://www.npmjs.com/package/@craco/craco) package to override webpack configuration. To build the solution use `npm run build` command. The build artifacts will be stored in the `build/` directory.
The build can be directly uploaded to Chrome Store or to local Chrome browser.
