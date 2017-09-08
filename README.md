# Share Button Study
The purpose of this extension is to visually highlight the share button in the browser toolbar when text from the URL bar is copied.

## Overview of extension
See [Bootstrapped extensions](https://developer.mozilla.org/en-US/Add-ons/Bootstrapped_extensions) for more information.

### bootstrap.js
MDN References [[1](https://developer.mozilla.org/en-US/docs/Extensions/bootstrap.js)] [[2](https://developer.mozilla.org/en-US/Add-ons/Bootstrapped_extensions#Bootstrap_entry_points)]

`startup()` 
1. Load the stylesheet for the share button animation.
2. Add the controller that detects the copy event in the URL bar.
3. Add an eventListener to the share button so that the CSS animation can be replayed.

`shutdown()`
1. Remove the CSS.
2. Remove the animation class from the share button.
3. Remove the controller from the URL bar.
4. Remove the eventListener from the share button.

### chrome.manifest
[MDN Reference](https://developer.mozilla.org/en-US/docs/Chrome_Registration)

This file is used to include resources (ie. share\_button.css). It associates "resource://share-button-study" with the current directory.

### install.rdf
[MDN Reference](https://developer.mozilla.org/en-US/Add-ons/Install_Manifests)

The install manifest includes information about the add-on such as the name, description, version number, etc.

### share_button.css
This file includes the animation that highlights the share button.
