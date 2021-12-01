'use strict';

import { fileToDataUrl } from "./helpers.js";
import { createForceLogoutModal, createModal, createModalShowAllPhotos, createSimpleModal } from "./modal.js";
import { viewOtherUserProfile } from "./profile.js";
import { REGEX_SPACE } from "./regex.js";
import { URL_DELETE_MESSAGE, URL_PIN_MESSAGE, URL_REACT_MESSAGE, URL_SPECIFIC_USER, URL_UNPIN_MESSAGE, URL_UNREACT_MESSAGE, URL_UPDATE_MESSAGE } from "./url.js";
import { appendAllChildNodes, clearAllChildNodes, createElement, formatTimeToString } from "./util.js";


// emoji list used in message react
const EMOJI_LIST = [
  '🤔', '☹', '😀', '😂', 
  '😈', '😅', '😓', '😨', 
  '😭', '🙌', '😕', '✌', 
  '👍', '🙏', '🙉', '🚑'
];


// avatar image for the message sender
const createMessageAvatar = (sender) => {
  const avatar = createElement({
    tag: 'img',
    src: '../styles/img/default_avatar.png',
    width: '40',
    height: '40',
    classes: ['hover-cursor-pointer'],
    onclick: () => viewOtherUserProfile(sender),
  });

  const token = sessionStorage.getItem("token");
  const urlForUser = URL_SPECIFIC_USER(sender);
  const optionsForUser = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  fetch(urlForUser, optionsForUser)
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
      // display the name and avatar
      if (data.image) {
        avatar.src = data.image;
      }
    })
    .catch((err) => {
      console.log(err);
    })
  ;

  return avatar;
}


// the first row of the message displays:
// sender name, datetime, edited datetime
const createMessageFirstRow = (sender, sentAt, edited, editedAt, pinned) => {
  const div = createElement({
    tag: 'div',
    classes: ['container-fluid', 'd-flex', 'flex-row', 'ps-0', 'flex-wrap', "align-items-center"],
  });

  // the first row: user name, sentAt time, edited, editedAt
  const divName = createElement({
    tag: 'p',
    classes: ['fw-bold', 'fs-6', 'm-0', 'hover-cursor-pointer'],
    textContent: '# user name',
    onclick: () => viewOtherUserProfile(sender),
  });

  const divSentAtTime = createElement({
    tag: 'p',
    classes: ['m-0', 'pe-3', 'ps-2'],
    textContent: formatTimeToString(sentAt),
  });

  divSentAtTime.style.fontSize = "0.85rem";
  appendAllChildNodes(div, [divName, divSentAtTime]);

  // if the message is edited, then deal with the message
  if (edited) {
    const divEdited = createElement({
      tag: 'p',
      classes: ['m-0', 'pe-3'],
      textContent: `edited at ${formatTimeToString(editedAt)}`,
    });

    divEdited.style.fontSize = "0.85rem";
    div.appendChild(divEdited);
  }


  // the pin icon always exist. just switch d-none, d-block
  const divPinned = createElement({
    tag: 'img',
    src: '../styles/img/pin-angle-orange.svg',
    width: '20',
    height: '20',
    classes: ['m-1'],
  });

  divPinned.style.fill = 'orange';
  div.appendChild(divPinned);

  if (!pinned) {
    divPinned.classList.add("d-none");
  }

  const switchPinIcon = (isPin) => {
    if (isPin) {
      divPinned.classList.remove("d-none");
    }
    else {
      divPinned.classList.add("d-none");
    }
  };


  // fetch for the user name
  const token = sessionStorage.getItem("token");
  const urlForUser = URL_SPECIFIC_USER(sender);
  const optionsForUser = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  fetch(urlForUser, optionsForUser)
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
      divName.textContent = data.name;
    })
    .catch((err) => {
      console.log(err);
    })
  ;


  return [div, switchPinIcon];
}


// the second row display the message content, and the pin icon, if the message is pinned
const createMessageSecondRow = (message, image, channelId, messageId) => {
  const div = createElement({
    tag: 'div',
    classes: [
      'container-fluid', 'd-flex', 'flex-column', 'ps-0',
      'message-second-row',
      'justify-content-end',
    ],
  });
  
  if (message) {
    const divMessageContent = createElement({
      tag: 'p',
      classes: ['m-0'],
      textContent: message,
    });
  
    divMessageContent.style.fontSize = '1.125rem';
    div.appendChild(divMessageContent);
  }

  if (image) {
    const divMessageImage = createElement({
      tag: 'img',
      classes: ['btn', 'border', 'rounded', 'mt-1'],
      width: '150',
      src: image,
      onclick: () => createModalShowAllPhotos(channelId, messageId),  
    });
    

    divMessageImage.style.alignSelf = 'flex-start';

    // if both message and image exist, add some space
    if (message) {
      divMessageImage.classList.remove("mt-1");
      divMessageImage.classList.add("mt-2");
    }


    div.appendChild(divMessageImage);
  }

  return div;
}


// each react emoji is displayed into a button.
// when the user clicks on his react, 
// then a modal window to confirm if he wants to delete this react.
const createMessageOneReactContent = (userId, emoji, channelId, messageId) => {
  const btn = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-sm', 'border', 'border-1', "rounded-pill", 'mb-1', 'me-1'],
    textContent: `emoji (user name)`,
  });

  // check the user id is myself or not.
  const myUserId = parseInt(sessionStorage.getItem("userId"));

  if (userId === myUserId) {
    btn.textContent = `${emoji} (You)`;

    btn.onclick = (e) => {
      e.preventDefault();
      
      // modal window to confirm
      const unreactCallback = () => {
        const url = URL_UNREACT_MESSAGE(channelId, messageId);

        const token = sessionStorage.getItem("token");
        const options = {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({react: emoji}),
        };

        fetch(url, options)
          .then((response) => {
            if (response.ok) {
              // remove this button
              btn.parentNode.removeChild(btn);

              // let the user know.
              createSimpleModal({
                title: 'Unreact Successful',
                content: `You have removed your react ${emoji} to this post.`,
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
      };

      // ask the user if he wants to unreact
      createModal({
        title: 'Unreact Confirmation',
        content: `Do you want to remove your react ${emoji} to this post?`,
        btnArray: [
          {
            textContent: 'Yes',
            isCloseModal: true,
            callback: unreactCallback,
          },
          {
            textContent: 'No',
            isCloseModal: true,
          }
        ]
      });
    }
  }
  else {
    // fetch for the user name.
    // and the button set disabled, so the user cannot click.
    btn.setAttribute('disabled', true);

    const url = URL_SPECIFIC_USER(userId);

    const token = sessionStorage.getItem("token");
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
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
        btn.textContent = `${emoji} (${data.name})`;
      })
      .catch((err) => {
        console.log(err);
      })
    ;
  }

  return btn;
}


// the third row displays all react emoji, and the user name
const createMessageThirdRow = (channelId, messageId, reacts) => {
  const div = createElement({
    tag: 'div',
    classes: [
      'container-fluid', 'd-flex', 'flex-row', 'ps-0', 'pe-1',
      'justify-content-start', 'align-items-center',
      'flex-wrap', 'pt-2',
    ]
  });

  // each emoji is wrapped by a button.
  // if the user is me, onclick is the unreact event.
  // if the user is not me, then disable the button
  if (reacts.length > 0) {
    const divAllReacts = reacts.map(
      (data) => createMessageOneReactContent(data.user, data.react, channelId, messageId)
    );
    appendAllChildNodes(div, divAllReacts);
  }

  return div;
}


// user edit message inside a modal. 
// the "callbackUpdateThisMsgWithNewData" is provided from the top level "createMessageDiv"
const createEditMessageModal = (channelId, messageId, oldData, callbackUpdateThisMsgWithNewData) => {
  // prepare the layout: a form inside a container
  const container = createElement({
    tag: 'div',
    classes: ['container-fluid'],
  });


  // message 
  const divMsg = createElement({
    tag: 'div',
    classes: ['input-group', 'mb-1'],
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

  if (oldData.message) {
    textarea.value = oldData.message;
  }

  container.appendChild(divMsg);
  appendAllChildNodes(divMsg, [spanForMsgIcon, textarea]);
  spanForMsgIcon.appendChild(msgIcon);


  // photo input.
  const divImageInput = createElement({
    tag: 'div',
    classes: ['mb-3', 'd-flex', 'flex-row', 'flex-wrap', 'justify-content-between'],
  });

  // left part
  const divImageInputLeft = createElement({
    tag: 'div',
    classes: ['input-group', 'input-group-sm', 'pt-2', 'pb-2']
  });

  divImageInputLeft.style.width = "fit-content";

  // right part
  const btnRemoveImg = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-outline-secondary', 'btn-sm'],
    textContent: 'Remove',
  });

  // left part detail
  const inputFileLabel = createElement({
    tag: 'label',
    classes: ['input-group-text'],
    for: 'new message upload photo',
    textContent: 'Photo',
  })

  const inputFile = createElement({
    tag: 'input',
    type: 'file',
    classes: ['form-control'],
    textContent: 'Choose Photo',
  });

  inputFile.style.minWidth = "210px";
  inputFile.style.maxWidth = "210px";

  container.appendChild(divImageInput);
  appendAllChildNodes(divImageInput, [divImageInputLeft, btnRemoveImg]);
  appendAllChildNodes(divImageInputLeft, [inputFileLabel, inputFile]);


  // the preview image, 
  // for simplicity, just display a large image.
  const divImagePreview = createElement({
    tag: 'div',
    classes: ['d-flex', 'justify-content-center', 'align-items-center'],
  });

  const imgPreview = createElement({
    tag: 'img',
    alt: 'edit message image preview',
    classes: ['border', 'rounded'],
    width: '470',
  });

  imgPreview.style.maxWidth = "90vw";

  if (oldData.image) {
    imgPreview.src = oldData.image;
  }
  else {
    imgPreview.classList.add("d-none");
  }

  container.appendChild(divImagePreview);
  divImagePreview.appendChild(imgPreview);


  // button function
  btnRemoveImg.onclick = (e) => {
    e.preventDefault();

    // if there is image, remove it
    if (!imgPreview.classList.contains('d-none')) {
      inputFile.value = "";
      imgPreview.classList.add("d-none");
    }
  };


  // input image
  inputFile.onchange = () => {
    // check file type
    const file = inputFile.files[0];
    
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ];
    const isValid = validFileTypes.find(type => type == file.type);

    if (!isValid) {
      createModal({
        title: 'Upload Photo Error',
        content: 'Sorry. We only support jpeg, png, and jpg files at this moment..',
        btnArray: [{
          textContent: 'OK',
          isCloseModal: true,
          callback: () => createEditMessageModal(channelId, messageId, oldData),
        }],
        topRightCloseOnclick: () => createEditMessageModal(channelId, messageId, oldData),
      });

      return;
    }

    // use the provided function to decode file into base64 format
    fileToDataUrl(file)
      .then((base64String) => {
        imgPreview.src = base64String;
        
        // show the image button
        if (imgPreview.classList.contains("d-none")) {
          imgPreview.classList.remove("d-none");
        }
      })
      .catch((err) => {
        inputFile.value = "";

        // hide the image preview button
        if (!imgPreview.classList.contains("d-none")) {
          imgPreview.classList.add("d-none");
        }

        createModal({
          title: 'Upload Photo Error',
          content: 'Sorry. We only support jpeg, png, and jpg files at this moment..',
          btnArray: [{
            textContent: 'OK',
            isCloseModal: true,
            callback: () => createEditMessageModal(channelId, messageId, oldData),
          }],
          topRightCloseOnclick: () => createEditMessageModal(channelId, messageId, oldData),
        });
      })
    ;
  }


  // submit function
  const submitCallback = () => {
    // sanity check on the textarea
    if (textarea.value.length > 0 && textarea.value.match(REGEX_SPACE)) {
      createModal({
        title: 'Submission Error',
        content: 'Sorry. The message value cannot be only spaces.',
        btnArray: [{
          textContent: 'OK',
          isCloseModal: true,
          callback: () => createEditMessageModal(channelId, messageId, oldData),
        }],
        topRightCloseOnclick: () => createEditMessageModal(channelId, messageId, oldData),
      });

      return;
    }

    // form the new data
    const newData = {};

    if (textarea.value.length > 0) {
      newData.message = textarea.value;
    }

    if (!imgPreview.classList.contains("d-none")) {
      newData.image = imgPreview.src;
    }

    // check if nothing is submitted
    if (Object.keys(newData).length == 0) {
      createModal({
        title: 'Submission Error',
        content: 'Sorry. The message cannot be empty. Please either fill the message or upload an image.',
        btnArray: [{
          textContent: 'OK',
          isCloseModal: true,
          callback: () => createEditMessageModal(channelId, messageId, oldData),
        }],
        topRightCloseOnclick: () => createEditMessageModal(channelId, messageId, oldData),
      });

      return;
    }


    // check if nothing changed
    if (newData.message === oldData.message && newData.image === oldData.image) {
      createModal({
        title: 'Submission Error',
        content: 'Sorry. The message cannot be the same as before.',
        btnArray: [{
          textContent: 'OK',
          isCloseModal: true,
          callback: () => createEditMessageModal(channelId, messageId, oldData),
        }],
        topRightCloseOnclick: () => createEditMessageModal(channelId, messageId, oldData),
      });

      return;
    }

    
    // now ready to submit
    const url= URL_UPDATE_MESSAGE(channelId, messageId);

    const token = sessionStorage.getItem("token");
    const options = {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newData),
    };

    fetch(url, options)
      .then((response) => {
        if (response.ok) {
          callbackUpdateThisMsgWithNewData(oldData, newData);
          createSimpleModal({
            title: 'Update Message Successful',
            content: 'You have successfully updated this message',
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
  };



  // create the modal
  const {divModalBody} = createModal({
    title: 'Edit Message Form',
    content: '',
    btnArray: [
      {
        textContent: 'Submit',
        isCloseModal: true,
        callback: submitCallback,
      },
      {
        textContent: 'Cancel',
        isCloseModal: true,
      }
    ],
  });

  clearAllChildNodes(divModalBody);
  divModalBody.appendChild(container);

}


// at the end of each message, there is a dropdown list.
// it has all emoji buttons. and a pin button.
// and if the message sender is myself, I can have edit and delete button.
// some callbacks are provided.
const createMessageDropdownList = (
  channelId, messageId, sender, pinned, 
  addNewReactToThirdRow, deleteWholeMessage, switchPinIcon, data, 
  callbackUpdateThisMsgWithNewData) => {

  const div = createElement({
    tag: 'div',
    classes: ['dropdown'],
  });

  // the dropdown list is opened by a button.
  // after open, it is a <ul> tag.
  const btnDropDown = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'dropdown-toggle', 'btn-sm'],
    id: 'dropdownMenuButton',
    'data-bs-toggle': 'dropdown',
    'aria-expanded': false,
  });

  const ulDropDown = createElement({
    tag: 'ul',
    classes: ['dropdown-menu', 'pt-1', 'pb-0'],
    'aria-labelledby': 'dropdownMenuButton',
  });

  appendAllChildNodes(div, [btnDropDown, ulDropDown]);


  // now prepare all the <li> inside the <ul> list
  // react option, these two li and a tag are for example
  const liDropDown = createElement({
    tag: 'li',
    classes: ['pb-1', 'pt-1'],
  });

  const linkDropDown = createElement({
    tag: 'a',
    classes: ['dropdown-item'],
    href: '#',
  });

  // many emoji for react
  const liForReact = liDropDown.cloneNode(false);
  const linksForReact = EMOJI_LIST.map((emoji) => {
    const link = createElement({
      tag: 'a',
      href: '#',
      textContent: emoji,
      classes: ['p-2'],
    });

    link.onclick = (e) => {
      e.preventDefault();

      // post the react
      const urlForReact = URL_REACT_MESSAGE(channelId, messageId);

      const token = sessionStorage.getItem("token");
      const optionsForReact = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'react': emoji}),
      };

      fetch(urlForReact, optionsForReact)
        .then((response) => {
          if (response.ok) {
            const myUserId = parseInt(sessionStorage.getItem("userId"));
            const newReactContent = createMessageOneReactContent(myUserId, emoji, channelId, messageId);
            
            // here needs to call the append function in the divThirdRow
            addNewReactToThirdRow(newReactContent);
          }
          else if (response.status == 403) {
            createForceLogoutModal();
          }
          else if (response.status == 400) {
            // if the user has post the emoji before, it will return 400
            createSimpleModal({
              title: 'Post Emoji Error',
              content: `You have posted ${emoji} already.`,
              btnText: 'OK',
            });
          }
        })
        .catch((err) => {
          console.log(err);
        })
      ;
    };

    return link;
  });

  ulDropDown.appendChild(liForReact);
  appendAllChildNodes(liForReact, linksForReact);


  // pin / unpin message option
  const liForPin = liDropDown.cloneNode(false);
  const linkForPin = linkDropDown.cloneNode(false);
  
  linkForPin.textContent = pinned ? 'Unpin' : 'Pin';
  linkForPin.setAttribute("pin", pinned);

  linkForPin.onclick = (e) => {
    e.preventDefault();

    // get the current pin / no pin status
    let isPinned = linkForPin.getAttribute("pin") === "true";

    const url = isPinned ? URL_UNPIN_MESSAGE(channelId, messageId) : URL_PIN_MESSAGE(channelId, messageId);
    
    const token = sessionStorage.getItem("token");
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    };

    fetch(url, options)
      .then((response) => {
        if (response.ok) {
          switchPinIcon(!isPinned);

          // and switch
          isPinned = !isPinned;
          linkForPin.textContent = isPinned ? 'Unpin' : 'Pin';
          linkForPin.setAttribute("pin", isPinned);
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

  ulDropDown.appendChild(liForPin);
  liForPin.appendChild(linkForPin);


  // if the sender is me, then I can edit or delete this message
  const myUserId = parseInt(sessionStorage.getItem("userId"));
  if (sender === myUserId) {
    // dropdown list add edit and delete option
    const liForEdit = liDropDown.cloneNode(false);
    const linkForEdit = linkDropDown.cloneNode(false);
    linkForEdit.textContent = "Edit";

    const liForDelete = liDropDown.cloneNode(false);
    const linkForDelete = linkDropDown.cloneNode(false);
    linkForDelete.textContent = "Delete";

    // join
    appendAllChildNodes(ulDropDown, [liForEdit, liForDelete]);
    liForEdit.appendChild(linkForEdit);
    liForDelete.appendChild(linkForDelete);


    // edit action
    linkForEdit.onclick = (e) => {
      e.preventDefault();
      createEditMessageModal(channelId, messageId, data, callbackUpdateThisMsgWithNewData);
    };


    // delete action
    linkForDelete.onclick = (e) => {
      e.preventDefault();

      const deleteCallback = () => {
        const urlDeleteMessage = URL_DELETE_MESSAGE(channelId, messageId);

        const token = sessionStorage.getItem("token");
        const optionsDeleteMessage = {
          method: 'DELETE',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };

        fetch(urlDeleteMessage, optionsDeleteMessage)
          .then((response) => {
            if (response.ok) {
              // use the callback to remove the whole message
              deleteWholeMessage();

              // then tell the user successful
              createSimpleModal({
                title: 'Delete Message Success',
                content: 'You have successfully deleted one message !',
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
      };

      // a modal window to confirm
      createModal({
        title: 'Delete Message Confirmation',
        content: 'Are you sure to delete this message?',
        btnArray: [
          {
            textContent: 'Yes',
            isCloseModal: true,
            callback: deleteCallback,
          },
          {
            textContent: 'No',
            isCloseModal: true,
          }
        ],
      });
    };
  }


  return div;
}


// this part creates a div for a channel message.
// the function will return that div. And the caller can append it to the container.
// the function first constructs the basic layouts. And then perform any necessary fetch.
const createMessageDiv = (data, channelId) => {
  // note: id is the messageId, sender is the userId
  // reacts: [array of utf-8 emoji],
  // sendAt and editAt are iso time string.
  // edit: true/false
  const {edited, editedAt, id, message, pinned, reacts, sender, sentAt, image} = data;

  // the div should have the class .message,
  // so the following fetch can pin-point the messageId using getAttribute
  const div = createElement({
    tag: 'div',
    classes: [
      'container-fluid', 'd-flex', 'flex-row', 
      'justify-content-start', 'align-items-start',
      'ps-2', 'pe-2', 'pt-2', 'pb-2',
      'message'
    ],
    messageId: id,
  });

  // the message format is:
  // leftmost: avatar,
  // middle: three rows,
  // rightmost: a dropdown list.

  // the avatar is created in a separate function
  const avatar = createMessageAvatar(sender);

  // the divMiddle is at the right side of the avatar
  // it is a wrapper for three rows
  const divMiddle = createElement({
    tag: 'div',
    classes: ['container-fluid', 'd-flex', 'flex-column', 'ps-3', 'pe-3', 'flex-nowrap'],
  });

  // first row: sender name, sent time, if edited, also show the edited date and time.
  // second row: display the message content, and the pin icon
  // third row: display the react contents
  const [divFirstRow, switchPinIcon] = createMessageFirstRow(sender, sentAt, edited, editedAt, pinned);
  const divSecondRow = createMessageSecondRow(message, image, channelId, id);
  const divThirdRow = createMessageThirdRow(channelId, id, reacts);
  appendAllChildNodes(divMiddle, [divFirstRow, divSecondRow, divThirdRow]);


  // the message content has a dropdown menu at the end
  // create a dropdown list. 
  // this is at the far right side of the message.
  // the dropdown list provides add emoji, add pin / remove pin, edit, delete, all four actions.

  // use this callback if a new react emoji is to be added onto the third row
  const addNewReactToThirdRow = (div) => divThirdRow.appendChild(div);

  // use this callback if the user choose to delete one message,
  const deleteWholeMessage = () => div.parentNode.removeChild(div);

  // now create the dropdown list.
  // provide a callback, so that when the user updates the message, 
  // it will have a div refresh, instead of a global refresh.
  const callbackUpdateThisMsgWithNewData = (oldData, newPartialData) => {
    const newData = newPartialData;

    for (const key in oldData) {
      if (!(key in newData) && key !== "image" && key !== "message") {
        newData[key] = oldData[key];
      }
    }

    // also add the edited and editedAt
    newData.edited = true;
    
    // iso time 
    const dt = new Date();
    newData.editedAt = dt.toISOString();

    // create new div and replace 
    const newDiv = createMessageDiv(newData, channelId);
    div.parentNode.replaceChild(newDiv, div);
  };

  const divDropDown = createMessageDropdownList(
    channelId, id, sender, pinned, 
    addNewReactToThirdRow, deleteWholeMessage, switchPinIcon, 
    data, 
    callbackUpdateThisMsgWithNewData
  );
  

  // on the top level
  appendAllChildNodes(div, [avatar, divMiddle, divDropDown]);
  return div;
};


export { createMessageDiv }








