'use strict'

import { fileToDataUrl } from "./helpers.js";
import { fillNavbarChannelDropdown, leaveChannel } from "./home.js";
import { createMessageDiv } from "./message.js";
import { createForceLogoutModal, createLargeImageModal, createModal, createScrollableModal, createSimpleModal, createModalShowAllPinnedMsg, createModalShowAllPhotos } from "./modal.js";
import { viewOtherUserProfile } from "./profile.js";
import { REGEX_SPACE } from "./regex.js";
import { URL_ALL_USERS, URL_CHANNEL_DETAIL, URL_CHANNEL_INVITE, URL_CHANNEL_MESSAGE, URL_POST_MESSAGE, URL_SPECIFIC_USER } from "./url.js";
import { appendAllChildNodes, clearAllChildNodes, createElement, formatCurrentTime, formatTimeToString, insertAllChildNodesBeforeNode } from "./util.js";


// edit channel: as long as this function is called, the user is guaranteed to be a member of this channel.
// the 6080 forum post tells that any member can edit the channel name and description.
// the page layout is similar to the new channel form.
const editThisChannel = (channelId)  => {
  // go to a new page, similar to the new channel page
  // get the "main"
  const main = document.getElementById("main");
  clearAllChildNodes(main);

  // the layout is similar to the login page,
  // for a big screen, there is an image on the left and the form on the right. 
  // for a small screen, only the form 

  // a grid row container
  const row = createElement({
    tag: 'div',
    classes: ['row', 'justify-content-around', 'pt-5'],
  });

  main.appendChild(row);

  // left picture
  const imgContainer = createElement({
    tag: 'div',
    classes: ['col-md-5', 'text-center', 'd-none', 'd-md-block'],
  })

  const img = createElement({
    tag: 'img',
    classes: ['img-fluid', 'p-3'],
    src: './styles/img/edit_channel.png',
    alt: 'edit channel cartoon image'
  });

  row.appendChild(imgContainer);
  imgContainer.appendChild(img);

  // the form container is similar to the img container
  // but it does not disappear for small screen
  const formContainer = createElement({
    tag: 'div',
    classes: ['col-10','col-md-5'],   
  })
  row.appendChild(formContainer);

  // the form tag acts as a container
  const form = createElement({
    tag: 'form',
    classes: ['row'],
  });
  formContainer.appendChild(form);

    // header 
  const header = createElement({
    tag: 'h3',
    classes: ['text-center', 'mb-4', 'col-xs-10', 'col-md-8'],
    textContent: 'Edit Channel Form',
  });

  form.appendChild(header);

  // email field
  const divName = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelName = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'new channel name',
    textContent: 'Channel Name',
  });

  const inputName = createElement({
    tag: 'input',
    type: 'text',
    classes: ['form-control'],
    required: 'required',
  });

  form.appendChild(divName);
  appendAllChildNodes(divName, [labelName, inputName]);


  // optional description
  const divDescription = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelDescription = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'new channel description',
    textContent: 'Channel Description',
  });

  const inputDescription = createElement({
    tag: 'textarea',
    classes: ['form-control'],
    rows: 5, 
    cols: 10,
  });

  // turn off the textarea resize
  inputDescription.style.resize = 'none';

  form.appendChild(divDescription);
  appendAllChildNodes(divDescription, [labelDescription, inputDescription]);
  

  // submit button, reset button and cancel button
  const divBtn = createElement({
    tag: 'div',
    classes: ['mt-1', 'mb-4', 'col-xs-10', 'col-md-8', 'text-center'],
  });

  const btnCancel = createElement({
    tag: 'button',
    type: 'button',
    textContent: 'Cancel',
    classes: ['btn', 'btn-primary', 'ps-3', 'pe-3', 'm-2'],
  });

  const btnReset = createElement({
    tag: 'button',
    type: 'button',
    textContent: 'Reset',
    classes: ['btn', 'btn-primary', 'ps-3', 'pe-3', 'm-2'],
  });

  const btnSubmit = createElement({
    tag: 'button',
    type: 'button',
    textContent: 'Submit',
    classes: ['btn', 'btn-primary', 'ps-3', 'pe-3', 'm-2'],
  })

  form.appendChild(divBtn);
  appendAllChildNodes(divBtn, [btnCancel, btnReset, btnSubmit]);

  
  // back button, back to that channel
  btnCancel.onclick = (e) => {
    e.preventDefault();
    renderThisChannel(channelId);
  };

  
  // fetch to fill the form, and arrange reset and submit buttons
  const token = sessionStorage.getItem('token');
  const url = URL_CHANNEL_DETAIL(channelId);
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  fetch(url, options)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      else if (response.status == 403) {
        createForceLogoutModal();
      }
      else {
        console.log(response.status);
      }
    })
    .then((data) => {
      const oldName = data.name;
      const oldDescription = data.description;

      // fill the form
      inputName.value = oldName;
      
      if (!oldDescription) {
        inputDescription.placeholder = 'No description for now...';
        inputDescription.value = "";
      }
      else {
        inputDescription.value = oldDescription;
        inputDescription.placeholder = "Channel Description";
      }


      // reset button
      btnReset.onclick = (e) => {
        e.preventDefault();
    
        inputName.value = oldName;
        
        if (!oldDescription) {
          inputDescription.placeholder = 'No description for now...';
          inputDescription.value = "";
        }
        else {
          inputDescription.value = oldDescription;
          inputDescription.placeholder = "Channel Description";
        }
    
        // tell the user the reset is complete
        createSimpleModal({
          title: 'Reset Complete',
          content: 'The form has been reset. ',
          btnText: 'OK',
        });
      };

      // submit button
      btnSubmit.onclick = (e) => {
        e.preventDefault();

        const newName = inputName.value;
        const newDescription = inputDescription.value;
    
        if (newName.length == 0) {
          createSimpleModal({
            title: 'Update Error',
            content: 'Please fill the channel name.',
            btnText: 'OK',
          });
    
          return;
        }
    
        // regex the name and description, cannot be all spaces
        const regexText = /[0-9A-Za-z]{1,}/;
    
        if (!newName.match(regexText)) {
          createSimpleModal({
            title: 'Update Error',
            content: 'Please fill a meaningful channel name.',
            btnText: 'OK',
          });
    
          return;
        }
    
        if (newDescription.length > 0 && (!newDescription.match(regexText))) {
          createSimpleModal({
            title: 'Update Error',
            content: 'Please fill a meaningful description.',
            btnText: 'OK',
          });
    
          return;
        }

        // the new value should not be the same as old value
        if (newName === oldName && newDescription === oldDescription) {
          createSimpleModal({
            title: 'Update Error',
            content: 'Please submit a new channel name or new channel description.',
            btnText: 'OK',
          });
    
          return;
        }
    
    
        // show the modal for the user to confirm 
        let confirmation = "You are going to update this channel. "
        confirmation += `The new channel name is \"${newName}\. `;
    
        if (newDescription.length === 0) {
          confirmation += `There is no description. `;
        } 
        else {
          confirmation += `The new channel description is ${newDescription}. `;
        }
    
        confirmation += `Are you sure to proceed?`;
    
        // prepare the callback
        const btnYesCallback = () => {
          // fetch, submit the new channel
          const url = URL_CHANNEL_DETAIL(channelId);
          const options = {
            method: 'PUT',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: newName,
              description: newDescription,
            }),
          };
    
          fetch(url, options)
            .then((response) => {
              if (response.status == 403) {
                createForceLogoutModal();
              }
              else if (response.status == 400) {
                createSimpleModal({
                  title: 'Update Error',
                  content: 'Sorry. Please refine the inputs and submit again.',
                  btnText: 'OK',
                });
              }
              else {
                return response.json();
              }
            })
            .then((data) => {
              console.log(data);
    
              // need to refresh the navbar dropdown lists
              fillNavbarChannelDropdown()
    
              // and the page displays the new channel information
              renderThisChannel(channelId);
    
              // at the same time (since the above is doing a fetch)
              // show a modal window saying the new channel is formed
              createSimpleModal({
                title: 'Update Success',
                content: 'You have successfully updated this channel !!',
                btnText: 'OK',
              })
            })
            .catch((err) => {
              console.log(err);
            })
          ;
        };
    
        createModal({
          title: 'Submission Confirmation',
          content: confirmation,
          btnArray: [
            {
              textContent: 'Yes',
              isCloseModal: true,
              callback: btnYesCallback
            },
            {
              textContent: 'No',
              isCloseModal: true,
            }
          ]
        });
      };
    })
    .catch((err) => {
      console.log(err);
    })
  ;



}


// show a long scrollable modal window, 
// list all users that not joined.
const inviteMemberToChannel = (channelId, reRenderLeftColumn) => {
  // list wrapper
  const divUserList = createElement({
    tag: 'div',
    classes: ['container-fluid'],
  });


  // so now, I need to do multiple fetches.
  // 1. fetch a list of all users in the website.
  // 2. fetch a list of users in this channel.
  // filter 1 by 2. 
  // for not joined users, 3. fetch their avatar and name.
  // display results in the modal.

  const urlForAllUsers = URL_ALL_USERS;
  const urlForChannel = URL_CHANNEL_DETAIL(channelId);
  const urls = [urlForAllUsers, urlForChannel];

  const token = sessionStorage.getItem("token");
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  };
  

  Promise.all(urls.map((url) => {
      return fetch(url, options)
        .then(response => {return response.json()})
        .then(data => {return data;})
    }))
    .then((data) => {
      const [userList, channelData] = data;
      
      const userIds = userList.users.map((user) => user.id);
      const removeIds = channelData.members;

      // remove removeIds from userIds
      const notJoinedIds = userIds.filter((userId) => !removeIds.includes(userId));
      
      // if the list is empty, pop a modal. 
      if (notJoinedIds.length == 0) {
        createSimpleModal({
          title: 'No More Users',
          content: 'All users have joined this channel.',
          btnText: 'OK',
        });

        return;
      } 


      // fetch their name, and then sort the name alphabetically.
      Promise.all(
        notJoinedIds.map((userId) => {
          const urlForUser = URL_SPECIFIC_USER(userId);

          return fetch(urlForUser, options)
            .then((response) => response.json())
            .then((data) => {
              const {name, img} = data;
              return {userId, name, img};
            })
          ;
        }))
        .then((users) => {
          // sort in letter order
          users.sort((a, b) => {
            if (a.name < b.name) return -1;
            else if (a.name > b.name) return 1;
            else return 0;
          });

          users.map((user) => {
            const {userId, img, name} = user;

            const divFormCheck = createElement({
              tag: 'div',
              classes: ['d-flex', 'flex-row', 'justify-content-start', 'pb-3', 'align-items-center'],
            });

            const avatar = createElement({
              tag: 'img',
              width: '32',
              height: '32',
              src: img ? img : "../styles/img/default_avatar.png",
            });

            const labelName = createElement({
              tag: 'label',
              classes: ['fs-6', 'ps-5','pe-5'],
              for: 'user name',
              textContent: name,
            });

            const checkbox = createElement({
              tag: 'input',
              classes: ['form-check-input'],
              type: 'checkbox',
              userId: userId,
            })

            appendAllChildNodes(divFormCheck, [avatar, labelName, checkbox]);
            divUserList.appendChild(divFormCheck);
          });
        })
      ;
    })
    .catch((err) => {
      console.log(err);
    })
  ;


  // consider the modal yes callback.
  // find all checkbox. each checkbox has a attribute "userId"
  const callback = () => {
    // getElementsByTagName return a html collections, not an array
    const htmlCollections = divUserList.getElementsByTagName("input");
    const checkboxes = [].slice.call(htmlCollections);

    // filter checked
    const checkedCheckboxes = checkboxes.filter((checkbox) => checkbox.checked);
    if (checkedCheckboxes.length == 0) {
      createModal({
        title: 'Error on Invitation Submission',
        content: 'Please select at least one user before submission.',
        btnArray: [{
          textContent: 'OK',
          isCloseModal: true,
        }],
      });

      return;
    }

    const userIds = checkedCheckboxes.map((checkbox) => parseInt(checkbox.getAttribute("userId")));
    Promise.all(
      userIds.map((userId) => {
        const urlInviteUser = URL_CHANNEL_INVITE(channelId);
        const optionsInviteUser = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({userId}),
        };
  
        return fetch(urlInviteUser, optionsInviteUser)
          .then((response) => {
            if (response.ok) {
              return 1;   // return 1 so that the .then can count how many success
            }
            else {
              throw err;
            }
          })
        ;
      }))
      .then((data) => {
        if (data.length === userIds.length) {
          // use the callback to refresh the left column
          reRenderLeftColumn();

          // tell the user
          createSimpleModal({
            title: 'Invite Members Success',
            content: `You have successfully invite ${data.length} members to this channel.`,
            btnText: 'OK', 
          });
        }
      })
      .catch((err) => console.log(err))
    ;
  };


  // create the scrollable modal
  createScrollableModal({
    title: 'Invite User To Channel',
    longContentWrapper: divUserList,
    btnArray: [
      {
        textContent: 'Submit',
        isCloseModal: true,
        callback: callback,
      },
      {
        textContent: 'Cancel',
        isCloseModal: true,
      },
    ],
  });
}


// fill the left bar with channel general information,
// including name, member list, created at time,
// and actions: view all photos in the channel, view all pinned messages in the channel,
// invite members, leave channel
const fillColumnLeft = (channelId) => {
  // obtain the container, and clear it
  const div = document.getElementById("single-channel-screen-left");
  
  // only keep the first child, which switches between messages and the channel div
  while (div.childElementCount > 1) {
    div.removeChild(div.lastChild);
  } 


  // channel name
  const divChannelName = createElement({
    tag: 'div',
    classes: ['container', 'pb-3', 'pt-1', 'd-flex', 'flex-row'],
  });

  const channelName = createElement({
    tag: 'h4',
    textContent: '# channel name',
    classes: ['pe-3'],
  });

  const btnEdit = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-sm', 'mb-1'],
    'data-bs-toggle': 'tooltip',
    'data-bs-placement': 'top',
    'title': 'Edit Channel',
  });

  const iconEdit = createElement({
    tag: 'img',
    src: '../styles/img/pencil.svg',
    width: '26',
    height: '26',
  });

  // the tooltip may always stay on the page, so need to manually hide it
  const tooltip = new bootstrap.Tooltip(btnEdit);

  // click the edit
  btnEdit.onclick = () => {
    tooltip.hide();
    editThisChannel(channelId);
  };

  div.appendChild(divChannelName);
  appendAllChildNodes(divChannelName, [channelName, btnEdit]);
  btnEdit.appendChild(iconEdit);
  

  // description
  const divDescription = createElement({
    tag: 'div',
    classes: ['container', 'pb-3', 'pt-1', 'justify-content-between'],
  });

  const labelDescription = createElement({
    tag: 'h5',
    textContent: '# Description',
  });

  const description = createElement({
    tag: 'h5',
    textContent: 'Description here',
    classes: ['fst-italic'],
  });

  div.appendChild(divDescription);
  appendAllChildNodes(divDescription, [labelDescription, description]);


  // create time
  const divCreateTime = divDescription.cloneNode(false);
  const labelCreateTime = createElement({
    tag: 'h5',
    textContent: '# Created at',
  });

  const createTime = createElement({
    tag: 'h5',
    textContent: 'xx:xx, xx/xx/xxxx',
  });

  div.appendChild(divCreateTime);
  appendAllChildNodes(divCreateTime, [labelCreateTime, createTime]);


  // members avatar and name
  const divMembers = divDescription.cloneNode(false);
  const labelMembers = createElement({
    tag: 'h5',
    textContent: '# Members',
  });

  const divMembersList = createElement({
    tag: 'div',
  });

  div.appendChild(divMembers);
  appendAllChildNodes(divMembers, [labelMembers, divMembersList]);

  
  // action buttons: view all photos, view all pinned messages, invite others, leave channel
  const divActions = divDescription.cloneNode(false);
  const labelActions = createElement({
    tag: 'h5',
    textContent: '# Actions',
  });

  const btnViewPhotos = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-secondary', 'm-1', 'btn-sm'],
    textContent: 'View Photos',
    onclick: () => createModalShowAllPhotos(channelId, -1),   // -1 means show from the latest to the oldest
  });

  const btnViewPinnedMsg = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-secondary', 'm-1', 'btn-sm'],
    textContent: 'View Pinned Messages',
    onclick: () => createModalShowAllPinnedMsg(channelId), 
  })


  // for a successful invitiation, the left column is rendered again
  const reRenderLeftColumn = () => fillColumnLeft(channelId);

  const btnInvite = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-primary', 'm-1', 'btn-sm'],
    textContent: 'Invite Member',
    onclick: () => {
      inviteMemberToChannel(channelId, reRenderLeftColumn);
    }
  });

  const btnLeave = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-danger', 'm-1', 'btn-sm'],
    textContent: 'Leave Channel',
    onclick: () => leaveChannel(channelId),
  });
  
  // join
  div.appendChild(divActions);
  appendAllChildNodes(divActions, [labelActions, btnViewPhotos, btnViewPinnedMsg, btnInvite,btnLeave]);


  // fetch the details of this channel
  const token = sessionStorage.getItem("token");

  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    }
  };

  const url = URL_CHANNEL_DETAIL(channelId);

  fetch(url, options)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      else if (response.status == 403) {
        createForceLogoutModal();
      }
      else {
        console.log(response.status);
      }
    }) 
    .then((data) => {
      // fill data
      channelName.textContent = `# ${data.name}`;
      description.textContent = data.description ? data.description : 'No description for now..';

      // format the time
      createTime.textContent = formatTimeToString(data.createdAt);

      // members showing avatar and name
      data.members.forEach((memberId) => {
        // fetch the avatar and name
        const url = URL_SPECIFIC_USER(memberId);
        const options = {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };

        fetch(url, options)
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            else if (response.status == 403) {
              createForceLogoutModal();
            }
            else {
              console.log(response.status);
            }
          })
          .then((data2) => {
            const divMember = createElement({
              tag: 'div',
              classes: ['container', 'd-flex', 'flex-row', 'pt-2', 'pb-2', 'ps-1', 'pe-0', 'align-items-center'],
            });

            const img = createElement({
              tag: 'img',
              classes: ['img-fluid', 'hover-cursor-pointer'],
              width: '36px',
              height: '36px',
              src: data2.image ? data2.image : '../styles/img/default_avatar.png',
              onclick: () => viewOtherUserProfile(memberId),
            })

            // the name has a tooltip to click to see profile
            const name = createElement({
              tag: 'p',
              classes: ['ps-4', 'mb-0', 'btn'],
              onclick: () => viewOtherUserProfile(memberId),
            });

            // check if this member is the creator
            if (data.creator === memberId) {
              name.textContent = `${data2.name} (creator)`;
            }
            else {
              name.textContent = data2.name;
            }

            // join DOM
            divMembersList.appendChild(divMember);
            appendAllChildNodes(divMember, [img, name]);
          })
          .catch((err) => {
            console.log(err);
          }) 
        ;
      });
    })
    .catch((err) => {
      console.log(err);
    })
  ;
}


// create a spinner for the fetch message loading
const createSpinner = () => {
  const div = createElement({
    tag: 'div',
    classes: ['d-flex', 'justify-content-center'],
  });

  const spinner = createElement({
    tag: 'div',
    classes: ['spinner-border'],
    role: 'status',
    'aria-hidden': true,
  })

  spinner.style.width = "1.7rem";
  spinner.style.height = "1.7rem";
  spinner.style.color = "grey";

  const span = createElement({
    tag: 'span',
    classes: ['visually-hidden'],
    textContent: 'Loading...',
  })

  div.appendChild(spinner);
  spinner.appendChild(span);
  return div;
}


// each message has an id. larger id means more close to now. 
// the fetch request has an parameter: "startIdx".
// the implementation is:
// startIdx = 0, fetch the latest <= 25 messages.
// say, startIdx = 0, it returns messageId 55, 54, 53, 52, ....
// then if you ask startIdx = 3, it will return messageId 52, 51, 50, ....

// so the fetchAndDisplayMessage function has a parameter isFetchLatest.
// if isFetchLatest == true, always set the messageId as 0.
// if isFetchLatest == false, count how many messages are in the container, and adjust the parameter.

// this will raise a problem. 
// for example, now the message container has 50 messages. And I want to fetch very earlier message.
// so I may set the startIdx as 50. 
// However, if someone sends a new message right before my request, 
// in order to fetch earlier mesasge, I should set the startIdx as 51. 

// so how to determine that no more earlier messages are there?
// only when the feedback amount has 0 message data, means that no more earlier messages.
// and for the new current messages, we can continue the fetch. 

// when user scrolls to the top, fetch earlier messages. 
// when no more, add .no-more-older-messages.
// when the user scrolls to the bottom, fetch latest new messages. 

// scroll listener for the infinite scroll.
const scrollListener = () => {
  const divMsg = document.getElementsByClassName("single-channel-screen-right-messages")[0];

  if (divMsg.scrollTop == 0) {
    fetchAndDisplayMessage(false);
  }
  else if (divMsg.scrollTop + divMsg.offsetHeight >= divMsg.scrollHeight) {
    fetchAndDisplayMessage(true);
  }
}


const fetchAndDisplayMessage = (isFetchLatest=true) => {
  // get the message container
  const divMsg = document.getElementsByClassName("single-channel-screen-right-messages")[0];

  // if wants to fetch earlier mesage, and see the .no-more-older-messages, then return
  if ((!isFetchLatest) && divMsg.getElementsByClassName("no-more-older-messages").length != 0) {
    return;
  }

  // remove the scroll listener
  divMsg.removeEventListener("scroll", scrollListener);

  // prepare the spinner and add to either bottom or the top
  const spinner = createSpinner();

  if (isFetchLatest) {
    divMsg.appendChild(spinner);
  }
  else {
    divMsg.insertBefore(spinner, divMsg.firstChild);
  }


  // determine the startIdx based on the isFetchLatest.
  // also append the spinner in position. 
  // if we are fetching the latest, simply set start Idx = 0
  let startIdx = 0;
  const divExistingMsg = divMsg.getElementsByClassName("message");

  if (!isFetchLatest) {
    startIdx = divExistingMsg.length;
  }


  // prepare the fetch
  const channelId = parseInt(divMsg.getAttribute("channelId"));
  const url = URL_CHANNEL_MESSAGE(channelId, startIdx);
  
  const token = sessionStorage.getItem("token");
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };


  fetch(url, options)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      else if (response.status == 403) {
        createForceLogoutModal();
      }
    })
    .then((data) => {
      // console.log(data);

      // reverse the order
      const rawMsgData = data.messages.reverse();

      // the backend may return some same msg to me, so filter with messageId
      let realMsgData;

      if (divExistingMsg.length != 0) {
        const minMsgIdx = parseInt(divExistingMsg[0].getAttribute("messageId"));
        const maxMsgIdx = parseInt(divExistingMsg[divExistingMsg.length - 1].getAttribute("messageId"));
        
        realMsgData = rawMsgData.filter((data) => data.id < minMsgIdx || data.id > maxMsgIdx);
      }
      else {
        realMsgData = rawMsgData;
      }


      // remove the spinner, and add new messages, if there are any new messages.
      divMsg.removeChild(spinner);

      if (realMsgData.length > 0) {
        // use the filtered data to create msg div
        const divNewMsg = realMsgData.map((msg) => createMessageDiv(msg, channelId));

        if (isFetchLatest) {
          // if there is the .no-more-new-messages at the bottom, remove it
          if (divMsg.getElementsByClassName("no-more-new-messages").length > 0) {
            const divToRemove = divMsg.getElementsByClassName("no-more-new-messages")[0];
            divMsg.removeChild(divToRemove);
          }

          appendAllChildNodes(divMsg, divNewMsg);
        }
        else {
          // isFetchLatest = false
          if (divExistingMsg.length == 0) {
            appendAllChildNodes(divMsg, divNewMsg);
          }
          else {
            insertAllChildNodesBeforeNode(divMsg, divMsg.firstChild, divNewMsg);
          }
        }

        // smooth scroll to the last of the divNewMsg.
        // too many fetches due to the scroll the last child into view. 
        // divNewMsg[0].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});

        // if initially the msg container is empty, scroll to the last msg 
        if (divExistingMsg.length == 0) {
          divNewMsg[divNewMsg.length - 1].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
        }
        else {
          // there are some messages already.
          if (isFetchLatest) {
            divNewMsg[0].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
          }
          else {
            // fetch older messages
            divNewMsg[divNewMsg.length - 1].scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"})
          }
        }
      }


      // determine if no more new messages.
      // if fetching the latest, and realMsgData > 25, then add the div-no-more
      if (isFetchLatest) {
        const divNoMore = createElement({
          tag: 'div',
          classes: [
            'font-monospace', 'text-center', 'fs-6', 'text-muted', 
            'no-more-new-messages', 'pt-2'
          ],
        });

        divNoMore.textContent = `--- no more new messages (last checked at ${formatCurrentTime()}) ---`;

        // before append, check if there is already that div.
        // but the whole message container may be empty, so check divMsg.lastChild first. 
        if (divMsg.lastChild && divMsg.lastChild.classList.contains("no-more-new-messages")) {
          divMsg.removeChild(divMsg.lastChild);
        }

        divMsg.appendChild(divNoMore);
      }
      else {
        // isFetchLatest = false
        // use the raw message data length to check.
        // this is since, people may send new messages during my fetch.
        // so only when raw message length == 0, that means no more older messages.
        if (rawMsgData.length == 0) {
          const divNoMore = createElement({
            tag: 'div',
            classes: ['font-monospace', 'text-center', 'fs-6', 'text-muted', 'no-more-older-messages', 'pb-2'],
          });

          divNoMore.textContent = '--- no more older messages ---';
          divMsg.insertBefore(divNoMore, divMsg.firstChild);
        }
      }


      // now add the event listener back
      divMsg.addEventListener("scroll", scrollListener);
    })
    .catch((err) => {
      console.log(err);
    })
  ;
}


// message input
const prepareMessageInput = () => {
  const div = document.getElementsByClassName("single-channel-screen-right-message-input")[0];
  clearAllChildNodes(div);

  // an input group, of two rows, 
  // 1: a message icon on the left, the input textarea (two rows) on the left 
  // 2. for the photo: input type = file, and a thumbnail space (initially d-none) for the preview.
  // a submit button
  const firstRow = createElement({
    tag: 'div',
    classes: ['input-group'],
  });

  const spanForMsgIcon = createElement({
    tag: 'span',
    classes: ['input-group-text'],
  });

  const msgIcon = createElement({
    tag: 'img',
    src: '../styles/img/chat-text.svg',
    width: '20',
    height: '20',
  });

  const textarea = createElement({
    tag: 'textarea',
    rows: '2',
    'aria-label': 'textarea',
    classes: ['form-control'],
  });

  textarea.style.resize = "none";

  // append
  div.appendChild(firstRow);
  appendAllChildNodes(firstRow, [spanForMsgIcon, textarea]);
  spanForMsgIcon.appendChild(msgIcon);

  // second row: photo input, preview, and submit button
  const secondRow = createElement({
    tag: 'div',
    classes: ['d-flex', 'flex-row', 'flex-wrap', 'mb-3', 'justify-content-between'],
  });

  // left part: file input, preview
  const secondRowLeft = createElement({
    tag: 'div',
    classes: ['input-group', 'input-group-sm', 'flex-nowrap', 'align-items-center', 'pt-2', 'pb-2'],
  });

  secondRowLeft.style.width = "fit-content";

  const secondRowLeftInputGroup = createElement({
    tag: 'div',
    classes: ['input-group', 'input-group-sm', 'align-items-center'],
  })

  const inputFileLabel = createElement({
    tag: 'label',
    classes: ['input-group-text'],
    for: 'new message upload photo',
    textContent: 'Photo',
  })

  const inputFile = createElement({
    tag: 'input',
    type: 'file',
    classes: ['form-control', 'me-4'],
    textContent: 'Choose Photo',
  });

  inputFile.style.minWidth = "210px";
  inputFile.style.maxWidth = "210px";

  // a preview image button.
  const btnImage = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-secondary', 'rounded', 'd-none'],
  });

  const img = createElement({
    tag: 'img',
    width: '28',
    height: '28',
  });

  btnImage.onclick = (e) => {
    e.preventDefault();
    createLargeImageModal(img.src);
  };

  // right part: a submit button
  const secondRowRight = createElement({
    tag: 'div',
    classes: ['d-flex', 'flex-row', 'justify-content-start'],
  })

  const btnClear = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-secondary', 'me-3', 'btn-sm'],
    textContent: 'Clear',
  });

  const btnSubmit = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-primary', 'btn-sm'],
    textContent: 'Submit'
  });


  div.appendChild(secondRow);
  appendAllChildNodes(secondRow, [secondRowLeft, secondRowRight]);

  appendAllChildNodes(secondRowLeft, [secondRowLeftInputGroup, btnImage]);

  appendAllChildNodes(secondRowLeftInputGroup, [inputFileLabel, inputFile]);

  btnImage.appendChild(img);

  appendAllChildNodes(secondRowRight, [btnClear, btnSubmit]);

  
  // upload file. 
  // for a successful upload, the image preview button will show.
  // for an unsuccessful upload, hide the image preview button
  inputFile.onchange = () => {
    // check file type
    const file = inputFile.files[0];
    
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ];
    const isValid = validFileTypes.find(type => type == file.type);

    if (!isValid) {
      createSimpleModal({
        title: 'Upload Photo Error',
        content: 'Sorry. We only support jpeg, png, and jpg files at this moment..',
        btnText: 'OK',
      });

      inputFile.value = "";

      // hide the image preview button
      if (!btnImage.classList.contains("d-none")) {
        btnImage.classList.add("d-none");
      }

      return;
    }

    // use the provided function to decode file into base64 format
    fileToDataUrl(file)
      .then((base64String) => {
        img.src = base64String;
        
        // show the image button
        if (btnImage.classList.contains("d-none")) {
          btnImage.classList.remove("d-none");
        }
      })
      .catch((err) => {
        inputFile.value = "";

        // hide the image preview button
        if (!btnImage.classList.contains("d-none")) {
          btnImage.classList.add("d-none");
        }

        createSimpleModal({
          title: 'Upload Photo Error',
          content: 'Sorry, something went wrong. Please upload again..',
          btnText: 'OK',
        });
      })
    ;
  }


  // clear button. clear textarea, inputFile, hide img
  btnClear.onclick = (e) => {
    e.preventDefault();

    textarea.value = "";
    inputFile.value = "";

    if (!btnImage.classList.contains("d-none")) {
      btnImage.classList.add("d-none");
    }
  };

  
  // submit button.
  // a valid message has the 3 types:
  // 1. only valid text (text not all spaces).
  // 2. only a photo.
  // 3. a valid text + photo
  btnSubmit.onclick = (e) => {
    e.preventDefault();

    const messageValue = textarea.value;
    if (messageValue != "" && messageValue.match(REGEX_SPACE)) {
      createSimpleModal({
        title: 'Send Message Error',
        content: 'Message cannot be all empty spaces.',
        btnText: 'OK',
      });

      return;
    }

    // extract the data
    const data = {};

    if (messageValue != "") {
      data.message = messageValue;
    }

    if (!btnImage.classList.contains("d-none")) {
      data.image = img.src;
    }

    // check if the data is empty
    if (Object.keys(data).length == 0) {
      createSimpleModal({
        title: 'Send Message Error',
        content: 'The message is empty. Please either fill the text or upload a photo.',
        btnText: 'OK',
      });

      return;
    }


    // prepare fetch
    const channelId = parseInt(div.getAttribute("channelId"));
    const url = URL_POST_MESSAGE(channelId);

    const token = sessionStorage.getItem("token");
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    fetch(url, options)
      .then((response) => {
        if (response.ok) {
          btnClear.click();
          fetchAndDisplayMessage(true);
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
  };
}


// fill the right part
const fillColumnRight = (channelId) => {
  // obtain the div and clear it
  const main = document.getElementById("single-channel-screen-right");
  
  // only keep the first child, which is the arrow div to flip between messages and the channel detail.
  while (main.childElementCount > 1) {
    main.removeChild(main.lastChild);
  }


  // the general structure is having a big div showing all messages, 
  // and a input box at the bottom
  const wrapper = createElement({
    tag: 'div',
    classes: [
      'container-fluid', 'h-100', 'd-flex', 'flex-column',
    ],
  });

  main.appendChild(wrapper);
  
  // top div, fill 90% height, and bottom for input.
  // use .single-channel-screen-right-messages to identify this container.
  // embed the channelId
  const divMsgContainer = createElement({
    tag: 'div',
    classes: [
      'container-fluid', 'flex-grow-1',
      'overflow-scroll',
      'pt-5', 'pb-5', 'ps-1', 'pe-1',
      'single-channel-screen-right-messages',
      'border', 'border-1', 'rounded',
      'mb-3',
    ],
    channelId: channelId,
  });

  // the message input box, also embed the channel id
  const divMsgInput = createElement({
    tag: 'div',
    classes: [
      'container-fluid',
      'single-channel-screen-right-message-input',
      'mb-1', 'ps-1', 'pe-1',
    ],
    channelId, channelId,
  });

  appendAllChildNodes(wrapper, [divMsgContainer, divMsgInput]);

  // fetch the latest up to 25 messages
  fetchAndDisplayMessage(true);

  // ffill the message input command
  prepareMessageInput();
}


// there are two columns in the main.
// small left column: showing channel name, description, all members with name and avatar.
// big right column: similar to the slack, show all message in ascending time order.
// for sm & xs screen, hide the left column on default. 
// and use an arrow button on the top right column to open the left column
const renderThisChannel = (channelId) => {
  // clear everything on the page
  const main = document.getElementById("main");
  clearAllChildNodes(main);

  // row
  const row = createElement({
    tag: 'div',
    classes: ['row'],
  });

  // hiding on xs and sm. 
  const colLeft = createElement({
    tag: 'div',
    classes: [
      'd-none', 'd-lg-block', 'd-xl-block', 'd-xxl-block',
      'col', 'col-xs-12', 'col-sm-12', 'col-md-12', 'col-lg-3', 'col-xl-3', 'col-xxl-3',
      'p-2',
    ],
    id: 'single-channel-screen-left',
  });

  // right, display at all time
  const colRight = createElement({
    tag: 'div',
    classes: [
      'd-block',
      'col', 'col-xs-12', 'col-sm-12', 'col-md-12', 'col-lg-9', 'col-xl-9', 'col-xxl-9',
      'p-2',
    ],
    id: 'single-channel-screen-right',
  });

  colRight.style.height = '90vh';

  main.appendChild(row);
  appendAllChildNodes(row, [colLeft, colRight]);

  // both left and right column has a icon.
  // for xs and sm screen, by default show the channel message, i.e. the right part. 
  // and there will be that icon on the page to slide in the side panel.
  const leftTopDiv = createElement({
    tag: 'div',
    classes: [
      'd-block', 'd-lg-none', 'd-xl-none', 'd-xxl-none',
      'container-fluid', 'd-flex', 'flex-row', 'justify-content-end', 'pb-2'
    ],
  });

  const btnOnLeft = createElement({
    tag: 'button',
    classes: ['btn'],
  });

  const btnOnLeftText = createElement({
    tag: 'p',
    classes: ['d-inline'],
    textContent: 'See Messages',
  });

  const btnLeftImage = createElement({
    tag: 'img',
    src: '../styles/img/arrow-right-square.svg',
    width: '28',
    height: '28',
    alt: 'arrow right',
    classes: ['ms-2'],
  })

  colLeft.appendChild(leftTopDiv);
  leftTopDiv.appendChild(btnOnLeft);
  appendAllChildNodes(btnOnLeft, [btnOnLeftText, btnLeftImage]);

  // for the right column, another button towards left
  const rightTopDiv = createElement({
    tag: 'div',
    classes: [
      'd-block', 'd-lg-none', 'd-xl-none', 'd-xxl-none',
      'container-fluid', 'd-flex', 'flex-row', 'justify-content-start', 'pb-2'
    ],
  });

  const btnOnRight = createElement({
    tag: 'button',
    classes: ['btn'],
  })

  const btnRightImage = createElement({
    tag: 'img',
    src: '../styles/img/arrow-left-square.svg',
    width: '28',
    height: '28',
    alt: 'arrow right',
    classes: ['me-2', 'd-inline'],
  })

  const btnOnRightText = createElement({
    tag: 'p',
    textContent: 'Channel Detail',
    classes: ['d-inline'],
  })

  colRight.appendChild(rightTopDiv);
  rightTopDiv.appendChild(btnOnRight);
  appendAllChildNodes(btnOnRight, [btnRightImage, btnOnRightText]);

  // onclick event
  // so for the smaller screen, since channel message is display by default,
  // the user must be able to see the btnOnRight at first.
  // click the right button, show the left panel
  btnOnRight.onclick = () => {
    colRight.classList.remove('d-block');
    colRight.classList.add('d-none');

    colLeft.classList.remove('d-none');
    colLeft.classList.add('d-block');
  };

  // click the left button, show the right panel
  btnOnLeft.onclick = () => {
    colLeft.classList.remove('d-block');
    colLeft.classList.add('d-none');

    colRight.classList.remove('d-none');
    colRight.classList.add('d-block');
  };


  // on the left bar, display the channel name, members, description, and all other details
  fillColumnLeft(channelId);

  // on the right bar, show the channel name, and the message box
  fillColumnRight(channelId);
}



export { renderThisChannel, fillColumnRight };

