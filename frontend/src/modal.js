'use strict';

import { createElement, clearAllChildNodes, appendAllChildNodes } from "./util.js";
import { checkAuthStatus } from "./auth.js";
import { URL_CHANNEL_MESSAGE } from "./url.js";
import { createMessageDiv } from "./message.js";
import { fillColumnRight } from "./channel.js";


// create a modal window. there is a id="modal" on the html page.
// btnArray: [{textContent: xxx, isCloseModal: boolean, onclick: a callback function}]
const createModal = ({title, content, btnArray, ...otherProps}) => {
  // the container
  const wrapper = document.getElementById("modalWrapper");
  clearAllChildNodes(wrapper);


  // create a fade background. 
  // class: myModal is in my css file, not the bootstrap file
  const divModal = createElement({
    tag: 'div',
    classes: ['myModal'],
  });

  wrapper.appendChild(divModal);

  // modal dialog div
  const divModalDialog = createElement({
    tag: 'div',
    classes: ['modal-dialog'],
  });

  divModal.appendChild(divModalDialog);

  // modal content div
  const divModalContent = createElement({
    tag: 'div',
    classes: ['modal-content'],
  });

  divModalDialog.appendChild(divModalContent);

  // modal header
  const divModalHeader = createElement({
    tag: 'div',
    classes: ['modal-header'],
  });

  divModalContent.appendChild(divModalHeader);

  // header content: a title and a button
  const h5 = createElement({
    tag: 'h5',
    textContent: title,
    classes: ['modal-title'],
  });

  // the X close button
  const btnCross = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn-close'],
  });

  // may have some other onclick actions to perform
  if (otherProps.topRightCloseOnclick) {
    btnCross.onclick = () => {
      clearAllChildNodes(wrapper);
      otherProps.topRightCloseOnclick();
    }
  }
  else {
    btnCross.onclick = () => clearAllChildNodes(wrapper);
  }

  // link to DOM
  appendAllChildNodes(divModalHeader, [h5, btnCross]);

  // modal body
  const divModalBody = createElement({
    tag: 'div',
    classes: ['modal-body'],
    textContent: content,
  });

  divModalContent.appendChild(divModalBody);

  // footer: buttons
  const divModalFooter = createElement({
    tag: 'div',
    classes: ['modal-footer'],
  });

  divModalContent.appendChild(divModalFooter);

  // maybe one button, maybe two buttons
  // check the variable btns: it is an array
  // if only one button, just assign as btn-primary
  // if two button, the first one is btn-secondary, the second one is btn-primary
  for (let i = 0; i < btnArray.length; i++) {
    const {textContent, isCloseModal, callback} = btnArray[i];

    const btn = createElement({
      tag: 'button',
      type: 'button',
      classes: ['btn'],
      textContent: textContent,
    });

    if (btnArray.length === 1) {
      btn.classList.add("btn-primary");
    }
    else if (i == 0) {
      btn.classList.add("btn-secondary");
    }
    else {
      btn.classList.add("btn-primary");
    }

    // if the button is simply close modal, assign it
    if (isCloseModal && (!callback)) {
      btn.onclick = () => clearAllChildNodes(wrapper);
    }
    else if (isCloseModal && callback) {
      // trigger the callback first, then close the modal.
      // since some contents may be on the modal
      btn.onclick = () => {
        clearAllChildNodes(wrapper);
        callback();
      };
    }
    else if (!callback) {
      // purely callback function, (should be very rare)
      btn.onclick = () => callback();
    }
    else {
      // nothing assigned, alert
      console.log(`ERROR: Modal button ${textContent} has nothing assigned !!!`);
    }

    divModalFooter.appendChild(btn);
  }

  // return the modal, if some functions require to modify the dialog
  return {divModal, divModalDialog, divModalContent, divModalHeader, divModalBody, divModalFooter};
}


// create a modal with scrollable content
const createScrollableModal = ({title, btnArray, longContentWrapper}) => {
  // first create the normal modal, with empty content
  const {divModalDialog, divModalBody} = createModal({
    title: title,
    btnArray: btnArray,
    content: '',
  });

  // now add .modal-dialog-scrollable
  divModalDialog.classList.add("modal-dialog-scrollable");

  // remove everything in the body. and no textContent
  divModalBody.textContent = "";
  clearAllChildNodes(divModalBody);

  // now add the long scroll content
  divModalBody.appendChild(longContentWrapper);
}


// upon the basic modal, create a modal that simply notify the user,
// and only one button "OK" to close the modal
const createSimpleModal = ({title, content, btnText}) => {
  return createModal({
    title: title,
    content: content,
    btnArray: [{
      textContent: btnText,
      isCloseModal: true,
    }],
  });
}


// when the token expires or what, use this modal to force log out everything
const createForceLogoutModal = () => {
  createModal({
    title: 'Authentication Error',
    content: 'Sorry. Something went wrong. Please try log in again.',
    btnArray: [{
      title: 'OK',
      isCloseModal: true,
      onclick: () => {
        sessionStorage.clear();
        checkAuthStatus();
      }
    }],
    topRightCloseOnclick: () => checkAuthStatus(),
  })
}


// user profile modal, based on the simple modal.
// name always exist, but the others may be null.
const createUserProfileModal = ({email, name, bio, image}) => { 
  // create an empty simple modal.
  // keep the X symbol on the top right.
  const {divModalContent, divModalHeader, divModalBody, divModalFooter} = createSimpleModal({
    title: '',
    content: '',
    btnText: '',
  });

  // add a shadow to the outer modal-content
  divModalContent.classList.add("shadow");  

  // modal header remove the border, remove padding bottom
  divModalHeader.classList.add("border-0");
  divModalHeader.classList.add("pb-0");

  // remove everything in the footer
  divModalContent.removeChild(divModalFooter);

  // clear everything inside modal body
  clearAllChildNodes(divModalBody);
  divModalBody.textContent = '';


  // create a container inside
  const container = createElement({
    tag: 'div',
    classes: [
      'container-fluid', 
      'd-flex', 'flex-column', 'justify-content-center', 'align-items-center',
      'pb-2',
    ],
  });

  divModalBody.appendChild(container);

  // top down format. avatar => user name => bio => email
  const avatar = createElement({
    tag: 'img',
    classes: [],
    width: '90',
    height: '90',
    src: image ? image : '../styles/img/default_avatar.png',
  });

  const labelName = createElement({
    tag: 'p',
    classes: ['fs-5', 'pt-3', 'pb-1', 'm-0', 'fw-bold', 'font-monospace'],
    textContent: name,
  });

  const labelEmail = createElement({
    tag: 'p',
    classes: ['text-muted', 'm-0', 'pb-1', 'pt-0', 'font-monospace'],
    textContent: email ? email : '(No email provided yet)',
  });

  const labelBio = createElement({
    tag: 'p',
    classes: ['text-muted', 'm-0', 'pt-0', 'font-monospace'],
    textContent: bio ? bio : '(No bio provided yet)',
  });

  appendAllChildNodes(container, [avatar, labelName, labelBio, labelEmail]);
}


// the modal window holds a large version of the image
const createLargeImageModal = (src) => {
  // create an empty simple modal.
  // keep the X symbol on the top right.
  const {divModalContent, divModalHeader, divModalBody, divModalFooter} = createSimpleModal({
    title: '',
    content: '',
    btnText: '',
  });

  // add a shadow to the outer modal-content
  divModalContent.classList.add("shadow");  

  // modal header remove the border, remove padding bottom
  divModalHeader.classList.add("border-0");
  divModalHeader.classList.add("pb-0");

  // remove everything in the footer
  divModalContent.removeChild(divModalFooter);

  // clear everything inside modal body
  clearAllChildNodes(divModalBody);
  divModalBody.textContent = '';


  // create a container inside
  const container = createElement({
    tag: 'div',
    classes: [
      'container-fluid', 
      'd-flex', 'flex-column', 'justify-content-center', 'align-items-center',
      'pb-2',
    ],
  });

  divModalBody.appendChild(container);

  // img
  const img = createElement({
    tag: 'img',
    alt: 'larger image view',
    src: src,
    width: '470',
  });

  // and for small screen, set max width not over 90% viewport width
  img.style.maxWidth = "90vw";
  container.appendChild(img);
}


// assume the channelId is valid.

// first fetch with startIdx = 0.
// then check the first messageId. say it is 121. 
// that means, we total need 5 fetches to get all messages, 
// since each fetch returns 25 messages, so 4 * 25 = 100 < 121, 5 * 25 = 125 > 121.
// can use promise.all to make the rest fetches together. 
const createModalShowAllPinnedMsg = (channelId) => {
  // display. assume data is not empty. 
  // same format as the message div. but no action button
  const displayOnModal = (data) => {
    // create a container
    const container = createElement({
      tag: 'div',
      classes: ['container-fluid'],
    });

    const divMsgs = data.map((msg) => createMessageDiv(msg, channelId));
    appendAllChildNodes(container, divMsgs);

    createScrollableModal({
      title: 'Pinned Messages',
      btnArray: [{
        textContent: 'Close',
        isCloseModal: true,
        callback: () => fillColumnRight(channelId),
      }],
      longContentWrapper: container,
    });
  };


  // prepare the callback after first fetch
  const actionAfterFirstFetch = (firstFetchData) => {
    // this fetch is startIdx = 0. 
    // if it is empty, then tell the user the channel has no mesages.
    if (firstFetchData.length == 0) {
      createSimpleModal({
        title: 'Pinned Messages',
        content: 'There are no messages in the channel right now...',
        btnText: 'OK',
      });

      return;
    }

    // array for all the message data.
    let allData = firstFetchData;

    // each fetch returns <= 25 mesages.
    // if first fetch amount < 25, then no need to continue fetch.
    if (allData.length == 25) {
      // fetch more
      let lastIdx = firstFetchData[firstFetchData.length - 1].id;
      let startIdx = 25;

      const startIdxArray = [];
      
      while (lastIdx > 0) {
        startIdxArray.push(startIdx);
        startIdx += 25;
        lastIdx -= 25;
      }

      // console.log(startIdxArray);

      // prepare fetch
      const token = sessionStorage.getItem("token");
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      // promise.all fetch
      Promise.all(startIdxArray.map((idx) => {
        const url = URL_CHANNEL_MESSAGE(channelId, idx);
        return fetch(url, options)
          .then((response) => {return response.json()})
          .then((data) => {return data.messages})
      }))
        .then((moreData) => {
          // merge data into allData
          for (let i = 0; i < moreData.length; i++) {
            allData = [...allData, ...moreData[i]];
          }

          // filter pinned 
          const pinnedData = allData.filter((msg) => msg.pinned);
          console.log(pinnedData);

          if (pinnedData.length == 0) {
            createSimpleModal({
              title: 'Pinned Messages',
              content: "You havent't pinned any messages yet..",
              btnText: 'OK',
            });

            return;
          }

          // reverse the time order, and display
          displayOnModal(pinnedData.reverse());
        })
        .catch((err) => {
          console.log(err);
        })
      ;
    }
    else {
      // directly treat on the data
      // filter pinned 
      const pinnedData = allData.filter((msg) => msg.pinned);
      console.log(pinnedData);

      if (pinnedData.length == 0) {
        createSimpleModal({
          title: 'Pinned Messages',
          content: "You havent't pinned any messages yet..",
          btnText: 'OK',
        });

        return;
      }

      // reverse the time order, and display
      displayOnModal(pinnedData.reverse());
    }
  };


  // first fetch, latest messages
  const url = URL_CHANNEL_MESSAGE(channelId, 0);

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
      else {
        console.log(response.status);
      }
    })
    .then((data) => {
      actionAfterFirstFetch(data.messages);
    })
    .catch((err) => {
      console.log(err);
    })
  ;
}


// similar to the modal showing all pinned messages.
// when messageId = -1, display the latest photo first.
// otherwise, display from the middle according to the messageId
const createModalShowAllPhotos = (channelId, messageId = -1) => {
  // display. assume data is not empty. 
  const displayOnModal = (data) => {
    const {divModalBody} = createModal({
      title: 'View Photos',
      textContent: '',
      btnArray: [{
        textContent: 'Close',
        isCloseModal: true,
      }],
    });

    clearAllChildNodes(divModalBody);

    // create a container
    const container = createElement({
      tag: 'div',
      classes: [
        'container-fluid',
        'ps-0', 'pe-0',
      ],
    });

    divModalBody.appendChild(container);


    // img
    const img = createElement({
      tag: 'img',
      alt: 'larger image view',
      width: '470',
    });

    // and for small screen, set max width not over 90% viewport width
    img.style.maxWidth = "90vw";

    container.appendChild(img);


    // left and right arrow
    const divControl = createElement({
      tag: 'div',
      classes: ['d-flex', 'flex-row', 'justify-content-between', 'align-items-center', 'pt-3'],
    });

    const btnLeft = createElement({
      tag: 'button',
      type: 'button',
      classes: ['btn', 'btn-sm'],
    });

    const iconArrowLeft = createElement({
      tag: 'img',
      src: '../styles/img/arrow-left.svg',
      width: '20',
      height: '20',
    });

    const btnRight = btnLeft.cloneNode(false);
    const iconArrowRight = iconArrowLeft.cloneNode(false);
    iconArrowRight.src = "../styles/img/arrow-right.svg";

    container.appendChild(divControl);
    appendAllChildNodes(divControl, [btnLeft, btnRight]);

    btnLeft.appendChild(iconArrowLeft);
    btnRight.appendChild(iconArrowRight);


    if (messageId == -1) {
      // display from the last image
      img.src = data[data.length - 1].image;
      img.setAttribute("data-idx", data.length - 1);

      // disable the right button
      btnRight.setAttribute("disabled", true);
    }
    else {
      // find the data-idx
      let idx = 0;
      while (data[idx].id != messageId) {
        idx += 1;
      }

      // find the photo
      img.src = data[idx].image;
      img.setAttribute("data-idx", idx);

      if (idx == 0) {
        btnLeft.setAttribute("disabled", true);
      }
      
      if (idx == data.length - 1) {
        btnRight.setAttribute("disabled", true);
      }
    }

    // click on the arrow
    btnLeft.onclick = () => {
      let currentIdx = parseInt(img.getAttribute("data-idx"));

      if (currentIdx == 0) {
        return;
      }

      currentIdx -= 1;
      img.src = data[currentIdx].image;
      
      if (btnRight.hasAttribute("disabled")) {
        btnRight.removeAttribute("disabled");
      }

      if (currentIdx == 0) {
        btnLeft.setAttribute("disabled", true);
      }

      img.setAttribute("data-idx", currentIdx);
    };

    btnRight.onclick = () => {
      let currentIdx = parseInt(img.getAttribute("data-idx"));

      if (currentIdx == data.length) {
        return;
      }

      currentIdx += 1;
      img.src = data[currentIdx].image;
      
      if (btnLeft.hasAttribute("disabled")) {
        btnLeft.removeAttribute("disabled");
      }

      if (currentIdx == data.length) {
        btnRight.setAttribute("disabled", true);
      }

      img.setAttribute("data-idx", currentIdx);
    }
  };


  // prepare the callback after first fetch
  const actionAfterFirstFetch = (firstFetchData) => {
    // this fetch is startIdx = 0. 
    // if it is empty, then tell the user the channel has no mesages.
    if (firstFetchData.length == 0) {
      createSimpleModal({
        title: 'View Photos',
        content: 'There are no messages in the channel right now...',
        btnText: 'OK',
      });

      return;
    }

    // array for all the message data.
    let allData = firstFetchData;

    // each fetch returns <= 25 mesages.
    // if first fetch amount < 25, then no need to continue fetch.
    if (allData.length == 25) {
      // fetch more
      let lastIdx = firstFetchData[firstFetchData.length - 1].id;
      let startIdx = 25;

      const startIdxArray = [];
      
      while (lastIdx > 0) {
        startIdxArray.push(startIdx);
        startIdx += 25;
        lastIdx -= 25;
      }

      // console.log(startIdxArray);

      // prepare fetch
      const token = sessionStorage.getItem("token");
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      // promise.all fetch
      Promise.all(startIdxArray.map((idx) => {
        const url = URL_CHANNEL_MESSAGE(channelId, idx);
        return fetch(url, options)
          .then((response) => {return response.json()})
          .then((data) => {return data.messages})
      }))
        .then((moreData) => {
          // merge data into allData
          for (let i = 0; i < moreData.length; i++) {
            allData = [...allData, ...moreData[i]];
          }

          // get all photos.
          const allPhotos = allData.filter((msg) => msg.image);

          if (allPhotos.length == 0) {
            createSimpleModal({
              title: 'View Photos',
              content: "There havent't been a photo yet...",
              btnText: 'OK',
            });

            return;
          }

          // reverse the time order, and display
          displayOnModal(allPhotos.reverse());
        })
        .catch((err) => {
          console.log(err);
        })
      ;
    }
    else {
      // get all photos.
      const allPhotos = allData.filter((msg) => msg.image);

      if (allPhotos.length == 0) {
        createSimpleModal({
          title: 'View Photos',
          content: "There havent't been a photo yet...",
          btnText: 'OK',
        });

        return;
      }

      // reverse the time order, and display
      displayOnModal(allPhotos.reverse());
    }
  };


  // first fetch, latest messages
  const url = URL_CHANNEL_MESSAGE(channelId, 0);

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
      else {
        console.log(response.status);
      }
    })
    .then((data) => {
      actionAfterFirstFetch(data.messages);
    })
    .catch((err) => {
      console.log(err);
    })
  ;
}


export { 
  createModal, createSimpleModal, 
  createForceLogoutModal, 
  createScrollableModal, createUserProfileModal,
  createLargeImageModal,
  createModalShowAllPinnedMsg,
  createModalShowAllPhotos,
};

