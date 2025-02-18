// ==UserScript==
// @name         Bonk Skin Grabber
// @version      1.0.0
// @description
// @match        https://bonk.io/gameframe-release.html
// @run-at       document-idle
// @grant        none
// @unwrap
// ==/UserScript==
exports(grabAvatar, saveAvatar);

const injectorName = `SkinGrabber`;
const errorMsg = `Whoops! ${injectorName} was unable to load.
This may be due to an update to Bonk.io. If so, please report this error!
This could also be because you have an extension that is incompatible with \
${injectorName}`;

const icons = [];
for (
  let i = 0;
  i < document.getElementById("skinmanager_allicons").children.length;
  i++
) {
  icons[i] = document.getElementById(`skinmanager_skin${i + 1}_icon`);
}
//const icons = Array.from(document.getElementById("skinmanager_allicons").children).map((element) => element.children[0]);

function injector(src) {
  let newSrc = src;

  //find avatar object class refrence
  const avatarRegex =
    /;(.{1,3}\[\d{1,3}\])=class(?:(?!}};).)*?makeSafe\(\) .*?}};/;
  const avatarMatch = src.match(avatarRegex);
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
  //set window.playerarray to arguments whenever setplayerarray is called (note. on all instances, so conflicts theoretically possible)
  //using a arrow function cuz i dont feel like naming a variable setPlayerArrayArray
  const setPlayerArray = ((src) => {
    let array = src.split(";");
    array.splice(array.length - 1, 0, "window.playerArray = [arguments][0][0]");
    return array.join(";");
  })(setPlayerArrayMatch[0]);
  const renderer = rendererMatch[0].replace(
    setPlayerArrayMatch[0],
    setPlayerArray
  );
  newSrc = newSrc.replace(rendererMatch[0], renderer);
  //need to replace magic strings like function names later
  // const saveAvatarRegex = /;function (X7_)\(.*?\){.*?;}}/;

  const saveAvatarRegex = /;function (\w{1,3})\((?:(?!;}}).)*?newavatar:.*?;}}/;
  const saveAvatarMatch = src.match(saveAvatarRegex);
  //rename func then remove close window function call
  const saveAvatarFuncName = "saveAvatarBg";
  const saveAvatarFunc = saveAvatarMatch[0]
    .replace(saveAvatarMatch[1], saveAvatarFuncName)
    .replace(/;\w{1,3}\(\)/, "");
  newSrc = newSrc.replace(
    saveAvatarMatch[0],
    saveAvatarMatch[0] +
      saveAvatarFunc +
      `window.saveAvatarFunction = ${saveAvatarFuncName};`
  );

  // const updateIconRegex = /;function (C0j)\(.*?\){.*?;}/;
  const updateIconRegex =
    /;function (\w{1,3})\((?:(?!;}).)*,33,33,null,null,null,4\);}/;
  const updateIconMatch = src.match(updateIconRegex);
  newSrc = newSrc.replace(
    updateIconMatch[0],
    updateIconMatch[0] + `window.updateIcon = ${updateIconMatch[1]};`
  );

  if (src === newSrc) throw "Injection failed!";
  console.log(injectorName + " injector run");
  return newSrc;
}

if (!window.bonkCodeInjectors) window.bonkCodeInjectors = [];
window.bonkCodeInjectors.push((bonkCode) => {
  try {
    return injector(bonkCode);
  } catch (error) {
    alert(errorMsg);
    throw error;
  }
});

function grabAvatar(username, openLink = true) {
  if (username === null) throw new Error("invalid username");
  const player = window.playerArray
    .filter((player) => player !== null)
    .find((player) => player.userName == username);
  if (player === undefined) throw new Error("could not find player");

  const avatar = new Avatar();
  avatar.fromObject(player.avatar);
  const link = "https://bonkleagues.io/editor.html?" + avatar.toString();
  if (openLink === true) window.open(link);
  else console.log(link);

  return avatar;
}

function saveAvatar(avatar, slot) {
  if (!avatar instanceof Avatar) throw new Error("invalid avatar");
  if (slot) {
    if (slot < 0 || slot > icons.length) throw new Error("invalid slot number");
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
