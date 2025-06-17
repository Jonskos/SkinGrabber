// ==UserScript==
// @name         Bonk Skin Grabber
// @version      1.0.1
// @description
// @match        https://bonk.io/gameframe-release.html
// @run-at       document-idle
// @grant        none
// @unwrap
// ==/UserScript==
exports(grabSkin, saveSkin);

//STOLEN
const injectorName = `SkinGrabber`;
const errorMsg = `Whoops! ${injectorName} was unable to load.
This may be due to an update to Bonk.io. If so, please report this error!
This could also be because you have an extension that is incompatible with \
${injectorName}`;
//STOLEN

const icons = [];
for (
  let i = 0;
  i < document.getElementById("skinmanager_allicons").children.length;
  i++
) {
  icons[i] = document.getElementById(`skinmanager_skin${i + 1}_icon`);
}
//const icons = Array.from(document.getElementById("skinmanager_allicons").children).map((element) => element.children[0]);

window.inLobby = false;

//STOLEN
function injector(src) {
  let newSrc = src;

  //find avatar object class refrence
  const avatarRegex =
    /;(.{1,3}\[\d{1,3}\])=class(?:(?!}};).)*?makeSafe\(\) .*?}};/;
  const avatarMatch = src.match(avatarRegex);
  if (avatarMatch === null) throw "Avatar class not found!";
  newSrc = newSrc.replace(
    avatarMatch[0],
    avatarMatch[0] + `window.Avatar = ${avatarMatch[1]};`
  );

  //find renderer class refrence
  const rendererRegex =
    /;(.{1,3}\[\d{1,3}\])=class(?:(?!}};).)*?resizeRenderer\(\) .*?}};/;
  const rendererMatch = src.match(rendererRegex);

  const setPlayerArrayRegex = /(?<=})setPlayerArray.*?}/;
  const setPlayerArrayMatch = rendererMatch[0].match(setPlayerArrayRegex);
  //set window.currentPlayerArray to arguments whenever setplayerarray is called (note. on all instances, so conflicts *theoretically* possible (unlikely) just saying cuz i dont know the bonk codebase that well)
  //using a arrow function cuz i dont feel like naming a variable setPlayerArrayArray
  const setPlayerArray = (() => {
    let array = setPlayerArrayMatch[0].split(";");
    array.splice(
      array.length - 1,
      0,
      "window.rendererPlayerArray = [arguments][0][0]"
    );
    return array.join(";");
  })();
  const renderer = rendererMatch[0].replace(
    setPlayerArrayMatch[0],
    setPlayerArray
  );
  if (rendererMatch === null) throw "Renderer class not found!";
  newSrc = newSrc.replace(rendererMatch[0], renderer);

  const saveAvatarRegex = /;function (\w{1,3})\((?:(?!;}}).)*?newavatar:.*?;}}/;
  const saveAvatarMatch = src.match(saveAvatarRegex);
  if (saveAvatarMatch === null) throw "Save avatar function not found!";
  const saveAvatarFuncName = "saveAvatarBg";
  //rename func then remove close window function call
  const saveAvatarFunc = saveAvatarMatch[0]
    .replace(saveAvatarMatch[1], saveAvatarFuncName)
    .replace(/;\w{1,3}\(\)/, ""); //currently it only checks for any funcitons that are called with no arguments, since there is only one, and there is no real need to semantially check for the function name
  newSrc = newSrc.replace(
    saveAvatarMatch[0],
    saveAvatarMatch[0] +
      saveAvatarFunc +
      `window.saveAvatarFunction = ${saveAvatarFuncName};`
  );

  //function to update the icon on the top left
  const updateIconRegex =
    /;function (\w{1,3})\((?:(?!;}).)*,33,33,null,null,null,4\);}/;
  const updateIconMatch = src.match(updateIconRegex);
  newSrc = newSrc.replace(
    updateIconMatch[0],
    updateIconMatch[0] + `window.updateIcon = ${updateIconMatch[1]};`
  );

  /* const handlePlayerJoinRegex =
    /;function \w{1,3}\((?:(?!;}}).)*?;((.{1,3}\[\d{1,3}\])\[.{1,3}\[0\]\[0\]\]={userName:.*?\};).*?;}}.{1,3}\[\d{1,3}\]=document/;
  const handlePlayerJoinMatch = src.match(handlePlayerJoinRegex);
  const handlePlayerJoin = handlePlayerJoinMatch[0].replace(
    handlePlayerJoinMatch[1],
    handlePlayerJoinMatch[1] +
      `window.lobbyPlayerArray=${handlePlayerJoinMatch[2]};`
  );
  console.log(handlePlayerJoin);
  newSrc = newSrc.replace(handlePlayerJoinMatch[0], handlePlayerJoin); */

  const lobbyPlayerArrayRegex =
    /;function \w{1,3}\((?:(?!;}}).)*?;(.{1,3}\[\d{1,3}\])\[.{1,3}\[0\]\[0\]\]={userName:.*?\};.*?;}}.{1,3}\[\d{1,3}\]=document/;
  const lobbyPlayerArrayMatch = src.match(lobbyPlayerArrayRegex);

  /*   const lobbyPlayerArrayInitRegex = new RegExp(lobbyPlayerArrayMatch[1] + "=\[\];");
  const lobbyPlayerArrayInitMatch = src.match(lobbyPlayerArrayInitRegex);
  console.log(lobbyPlayerArrayInitMatch); */
  // newSrc = newSrc.replace(lobbyPlayerArrayInitMatch[0], lobbyPlayerArrayInitMatch[0] + "window.lobbyPlayerArray=" + lobbyPlayerArrayMatch[1]);

  newSrc = newSrc.replace(
    `${lobbyPlayerArrayMatch[1]}=[];`,
    `${lobbyPlayerArrayMatch[1]}=[];window.lobbyPlayerArray=${lobbyPlayerArrayMatch[1]};`
  );

  //find network engine function, which is constructed when joining a lobby. Needed since the player array is not updated leaving game
  const networkEngineRegex =
    /;function \w{1,3}\((?:.{1,3},?){3}\){var .{1,3}=\[arguments\];.{1,3}\[2\]=.{1,5};.{1,3}\[1\]=1(?:(?!;};}).)*?;};}/;
  const networkEngineMatch = src.match(networkEngineRegex);

  const networkEngine = (() => {
    let array = networkEngineMatch[0].split(";");
    //put inLobby = true when network engine is constructed
    array.splice(3, 0, "window.inLobby = true");
    //put inLobby = false in the destructor
    array.splice(
      array.length - 1,
      0,
      "let originalDestructor = this.destroy;this.destroy = () => {window.inLobby = false;originalDestructor.apply(this, arguments);}"
    );
    return array.join(";");
  })();

  newSrc = newSrc.replace(networkEngineMatch[0], networkEngine);

  if (src === newSrc) throw "Injection failed!";
  console.log(injectorName + " injector run");
  return newSrc;
}
//STOLEN

if (!window.bonkCodeInjectors) window.bonkCodeInjectors = [];
window.bonkCodeInjectors.push((bonkCode) => {
  try {
    return injector(bonkCode);
  } catch (error) {
    alert(errorMsg);
    throw error;
  }
});

function grabSkin(username, openLink = true) {
  if (username === null) throw "Invalid username";

  const playerArray =
    inLobby ? window.lobbyPlayerArray : window.rendererPlayerArray;

  const player = playerArray
    .filter((player) => player !== null)
    .find((player) => player.userName == username);
  if (player === undefined) throw "Could not find player";

  const link = "https://bonkleagues.io/editor.html?" + player.avatar.toString();
  if (openLink === true) window.open(link);
  else console.log(link);

  return player.avatar;
}

function saveSkin(avatar, slot) {
  if (!avatar instanceof Avatar) throw "Invalid avatar";
  if (slot) {
    if (slot < 0 || slot > icons.length) throw "Invalid slot number";
    icons[slot].click();
  }

  saveAvatarFunction(avatar);
  updateIcon();
}

function exports(...functions) {
  for (let i = 0; i < functions.length; i++) {
    window.parent[functions[i].name] = functions[i];
  }
}