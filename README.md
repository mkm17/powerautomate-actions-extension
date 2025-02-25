# Power Automate Actions Chrome Extension

[See how to install it now!](#how-to-install-the-tool)

The Power Automate Actions tool serves as a versatile solution for managing Power Automate actions. It offers the following functionalities:

## **1. Recording all HTTP requests from SharePoint**

 **Catching requests invoked directly from the SharePoint interface**

![Recorded Actions](/images/RecordDefaultSPActions.gif)


 **Recording requests invoked from the browser console**

![Recorded Actions](/images/RecordConsoleAction.gif)


 **Gathering requests executed with SP Editor**

![Recorded Actions](/images/RecordActionsFromSPEditor.gif)

<br />
<br />

## **2.	Duplicating actions in between tenants and environments**

Easily copy all actions from the "My Clipboard" section and paste them into the desired environment.


![Copy Actions Between Environments](/images/CopyBetweenEnvs.gif)

<br />
<br />

## **3.	Coping actions from community blogs**

- Copy all actions stored on a page
- Copy individual actions using the provided copy button
- Check out [our article on bulb presence](https://michalkornet.com/2023/04/25/Bulb_Presence.html), for a reference.

![Copy Actions from blog](/images/CopyItemsFromBlogAndSaveOnFlow.gif)

<br />
<br />

## **4.	Storing actions in a more persistent way**
Copy actions from My *Clipboard Section*.

![Copy Actions from My Clipboard](/images/CopyMyClipboardActions.gif)

<br />
<br />

Using recorded and copied actions in Power Automate workflows.

Please note that in order to use the copied actions, you need to have the "My Clipboard" section open. 
Accepting the popup window will finish the action copying process.

![Paste Actions to my clipboard](/images/CopyItemsToMyClipboard.gif)

<br />
<br />


## **5.	Extended Copy/Paste feature for the new PowerAutomate editor**
In version 1.0.4 the new feature was added to the extension. It allows for store copied actions to the extension storage and choose which actions should be pasted to the workflow.

![Copy Paste Example](/images/CopyPasteExample.gif)

#### **How to install the tool?**

The tool is available on the Chrome Store [here](https://chrome.google.com/webstore/detail/power-automate-actions-ha/eoeddkppcaagdeafjfiopeldffkhjodl?hl=pl&authuser=0)  

The repository also includes the build package, allowing for direct installation.
To do so please unpack *[ApplicationBuild](https://github.com/mkm17/powerautomate-actions-extension/blob/main/ApplicationBuild.zip)* zip file and follow the steps described [here](https://support.google.com/chrome/a/answer/2714278?hl=en) to install the package locally on a browser. 


## Available Scripts

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

The solution uses [craco](https://www.npmjs.com/package/@craco/craco) package to override webpack configuration. To build the solution use `npm run build` command. The build artifacts will be stored in the `build/` directory.
The build can be directly uploaded to local Chrome browser [guideline](https://support.google.com/chrome/a/answer/2714278?hl=en).

## New Features

**1.0.10**
- Added recording capability on the SharePoint Admin page.
- Enabled the ability to copy actions within iframes (including the make.powerapps page and directly from Canvas Apps).
- **Fixes**
- Rendering record buttons on SharePoint modern pages – additional iframe fix.
- Fix action icons rendering

**1.0.7**
- Fixed pasting recorded actions into the new Power Automate editor.
- Added a notification banner.

**1.0.6**
- Added support for HTTP Microsoft Graph actions.
- Enabled recording of actions on Microsoft Graph Explorer and Classic SharePoint pages.
- Enhanced persistence of recorded actions.
- Fixed scrolling for actions.

**1.0.5**
- Fixed issue with storage of new editor Power Automate actions.

**1.0.4**
- Added support for copying actions from the new Power Automate editor.

**1.0.3**
- Improved handling of SharePoint requests using the _vti_bin endpoint.

