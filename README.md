# RoAvatar

## A remake of the Roblox avatar editor with new and improved features

![A screenshot of RoAvatar v1.6.0](https://i.imgur.com/ixdNmtH.png)

> [!WARNING]
> The only official versions of RoAvatar are the ones in the [steinann/RoAvatar](https://github.com/steinann/RoAvatar/) GitHub repository, the [Chrome Web Store](https://chromewebstore.google.com/detail/roavatar/ifjleokejkklabhcfhppncfdbkmakhdp), [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/roavatar/mienanddicehclnklbnhjefcoimifipd) and [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/roavatar/). Downloading the extension from other sources may be unsafe.

## Using the Extension
<a href="https://chromewebstore.google.com/detail/roavatar/ifjleokejkklabhcfhppncfdbkmakhdp" title="Chrome Web Store">
    <img src="https://developer.chrome.com/static/docs/webstore/branding/image/iNEddTyWiMfLSwFD6qGq.png">
</a>
<a href="https://microsoftedge.microsoft.com/addons/detail/roavatar/mienanddicehclnklbnhjefcoimifipd" title="Microsoft Edge Add-ons">
    <img style="height: 90px" src="https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/add-ons-badge-images/microsoft-edge-add-ons-badge.png">
</a>
<br>
You can also build the newest version yourself OR get the latest stable version from <a href="https://github.com/Mzigi/RoAvatar/releases">releases</a>
<br>
<br>

**Instructions on building**:
- Install Node.js and npm [(guide)](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- Install Git [(guide)](https://github.com/git-guides/install-git)
- Run `git clone --recursive https://github.com/steinann/RoAvatar.git`
- If you are missing submodules, run `git submodule update --init`
- Run `npm install` in the project directory
- It is also recommended to build the RoAvatar Renderer and using `npm link roavatar-renderer` in the renderer project and `npm link` in the RoAvatar project OR use yalc
- Run `npm run build` to build the project
- The build will be in the **dist** folder in the project directory
- You can then load the **dist** folder as an unpacked extension in your browser [(guide)](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- The avatar editor will be available at https://www.roblox.com/roavatar
<br>

**Instructions on installing release**:
- Download RoAvatar.zip and unzip
- Load the folder as an unpacked extension in your browser [(guide)](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- The avatar editor will be available at https://www.roblox.com/roavatar

## Links
Discord: https://discord.gg/PHa5Vgtbva

Website: https://roavatar.net

## License
The project is licensed under GPL-3. The RoAvatar branding and related assets are exempt from the license and not available for use.

## Renderer
The renderer that this extension uses has a standalone github repository and npm package:
[npm](https://www.npmjs.com/package/roavatar-renderer) | [GitHub](https://github.com/steinann/RoAvatar-Renderer)

Copyright (C) 2026 RoAvatar authors & @steinann on GitHub
