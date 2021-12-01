'use strict';

import { renderThisChannel } from "./channel.js";
import { createForceLogoutModal, createSimpleModal } from "./modal.js";
import { viewMyProfile, viewOtherUserProfile } from "./profile.js";
import { REGEX_NUMBER } from "./regex.js";
import { URL_CHANNEL_MESSAGE, URL_SPECIFIC_USER } from "./url.js";


const onHashChange = () => {
  // obtain the hash string, remove the # symbol
  const hashString = window.location.hash.substr(1,);

  // the hash string may be empty, if empty, do nothing
  if (hashString.length === 0) {
    return;
  }

  // obtain the first key value
  const tokens = hashString.split('=');
  const key = tokens[0];
  
  // channel => channelId
  // profile
  // profile = {userId}

  // all these functions require the login. 
  // if the user does not login, ask them to login first.
  if (key.toLowerCase() === 'profile' || key.toLowerCase() === 'channel') {
    if (!sessionStorage.getItem('token')) {
      createSimpleModal({
        title: 'Access Error',
        content: 'Please log in before taking further actions.',
        btnText: 'OK',
      });

      return;
    }
  }
  else {
    // the hash key can only be profile or channdlid.
    // for the other key, alert the user that they are not valid
    createSimpleModal({
      title: 'Address Error',
      content: 'The hash URL only supports /#channel={channelId}, /#profile, and /#profile={userId}.',
      btnText: 'OK',
    });

    return;
  }

  // profile, or profile={userId}
  if (key.toLowerCase() === 'profile') {
    // if no userId
    if (tokens.length === 1) {
      viewMyProfile();
    }
    else {
      let userId = tokens[1];
      if ((!userId) || (!userId.match(REGEX_NUMBER))) {
        createSimpleModal({
          title: 'View User Profile Error',
          content: 'Please enter a valid userId in the URL.',
          btnText: 'OK',
        });
  
        return;
      }
  
      // for simplicity, fetch the user id first, if return 200, then call the function to render.
      userId = parseInt(userId);

      const url = URL_SPECIFIC_USER(userId);
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      };

      fetch(url, options)
        .then((response) => {
          if (response.ok) {
            viewOtherUserProfile(userId);
          }
          else if (response.status == 400) {
            createSimpleModal({
              title: 'View User Profile Error',
              content: `Sorry. The user with id = ${userId} does not exist.`,
              btnText: 'OK',
            });
          }
          else if (response.status == 403) {
            createForceLogoutModal();
          }
          else {
            console.log(response.status);
          }
        })
        .catch((err) => {
          console.log(err);
        })
      ;
    }
  }
  else {
    // channel={channelId}
    let channelId = tokens[1];
    if ((!channelId) || (!channelId.match(REGEX_NUMBER))) {
      createSimpleModal({
        title: 'View Channel Error',
        content: 'Please enter a valid channel Id in the URL.',
        btnText: 'OK',
      });

      return;
    }

    // convert to integer
    channelId = parseInt(channelId);

    // check if the user is in the channel by call getting message. 
    // if return 200, then direct the user to the channel, 
    // if return 400, that means the channelId is either invalid, or the user is not in the channel.
    const url = URL_CHANNEL_MESSAGE(channelId, 0);
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    };

    fetch(url, options)
      .then((response) => {
        if (response.ok) {
          renderThisChannel(channelId);
        }
        else if (response.status == 403) {
          createForceLogoutModal();
        }
        else if (response.status == 400) {
          createSimpleModal({
            title: 'Access Channel Error',
            content: 'Sorry. Either the channel Id is invalid or you did not join that channel...',
            btnText: 'OK',
          });
        }
        else {
          console.log(response.status);
        }
      })
      .catch((err) => {
        console.log(err);
      })
    ;
  }
}


export {onHashChange};

