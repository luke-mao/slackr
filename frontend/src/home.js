'use strict';

import { URL_CHANNEL, URL_JOIN_CHANNEL, URL_LEAVE_CHANNEL, URL_SPECIFIC_USER } from "./url.js";
import { appendAllChildNodes, clearAllChildNodes, createElement } from "./util.js";
import { createForceLogoutModal, createModal, createSimpleModal } from "./modal.js";
import { checkAuthStatus } from "./auth.js";
import { renderThisChannel } from "./channel.js";
import { viewMyProfile } from "./profile.js";


// a form to fill the new channel
const renderNewChannelPage = () => {
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
    src: './styles/img/new_channel.png',
    alt: 'new channel cartoon image'
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
    textContent: 'New Channel Form',
  });

  form.appendChild(header);

  // name field
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
    placeholder: 'Channel Name',
    required: 'required',
  });

  form.appendChild(divName);
  appendAllChildNodes(divName, [labelName, inputName]);

  // a switch for private or false
  const divSwitch = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const divSwitchInner = createElement({
    tag: 'div',
    classes: ['form-check', 'form-switch', 'ps-0'],
  });

  const inputSwitch = createElement({
    tag: 'input',
    classes: ['form-check-input', 'ms-1'],
    type: 'checkbox',
    role: 'switch',
    checked: true,
  });

  const labelSwitch = createElement({
    tag: 'label',
    classes: ['form-check-label', 'ps-3'],
    for: 'choosing private or public',
    textContent: 'Private Channel',
  });

  form.appendChild(divSwitch);
  divSwitch.appendChild(divSwitchInner);
  appendAllChildNodes(divSwitchInner, [inputSwitch, labelSwitch]);

  // the input switch has onclick listener
  inputSwitch.onclick = () => {
    if (inputSwitch.hasAttribute('checked')) {
      inputSwitch.removeAttribute('checked');
      labelSwitch.textContent = 'Public Channel';
    }
    else {
      inputSwitch.setAttribute('checked', true);
      labelSwitch.textContent = 'Private Channel';
    }
  }

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
    placeholder: 'Optional (can leave empty)',
    rows: 5, 
    cols: 10,
  });

  // turn off the textarea resize
  inputDescription.style.resize = 'none';

  form.appendChild(divDescription);
  appendAllChildNodes(divDescription, [labelDescription, inputDescription]);
  

  // submit button
  const divBtnSubmit = createElement({
    tag: 'div',
    classes: ['mt-1', 'mb-4', 'col-xs-10', 'col-md-8', 'text-center'],
  });

  const btnSubmit = createElement({
    tag: 'button',
    type: 'button',
    textContent: 'Submit',
    classes: ['btn', 'btn-primary', 'ps-5', 'pe-5'],
  })

  form.appendChild(divBtnSubmit);
  divBtnSubmit.appendChild(btnSubmit);

  // click submit button
  btnSubmit.onclick = (e) => {
    e.preventDefault();

    const name = inputName.value;
    const description = inputDescription.value;
    const isPrivate = inputSwitch.hasAttribute('checked') ? true : false;

    if (name.length == 0) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please fill the channel name.',
        btnText: 'OK',
      });

      return;
    }

    // regex the name and description, cannot be all spaces
    const regexText = /[0-9A-Za-z]{1,}/;

    if (!name.match(regexText)) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please fill a meaningful channel name.',
        btnText: 'OK',
      });

      return;
    }

    if (description.length > 0 && (!description.match(regexText))) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please fill a meaningful description.',
        btnText: 'OK',
      });

      return;
    }


    // show the modal for the user to confirm 
    let confirmation = "You are going to create a new channel. "
    confirmation += `The channel name is \"${name}\. `;
    confirmation += `This channel is a ${isPrivate ? "private" : "public"} channel.`;

    if (description.length === 0) {
      confirmation += `There is no description. `;
    } 
    else {
      confirmation  += `The channel description is ${description}. `;
    }

    confirmation += `Are you sure to proceed?`;

    // prepare the callback
    const btnYesCallback = () => {
      // fetch, submit the new channel
      const token = sessionStorage.getItem('token');
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name,
          description: description,
          'private': isPrivate,
        }),
      };

      fetch(URL_CHANNEL, options)
        .then((response) => {
          if (response.status == 403) {
            createForceLogoutModal();
          }
          else if (response.status == 400) {
            createSimpleModal({
              title: 'Submission Error',
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
          fillNavbarChannelDropdown();

          // and the page displays the new channel information
          renderThisChannel(data.channelId);

          // at the same time (since the above is doing a fetch)
          // show a modal window saying the new channel is formed
          createSimpleModal({
            title: 'Submission Success',
            content: 'You have successfully created a new channel!!',
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
};


// given a channel member list, check if the current user is inside the channel or not
// return a boolean
const IsUserInThisChannel = (memberList, userId) => {
  return memberList.includes(userId);
}


// since the backend fills both public and private in an array,
// so here fill the two dropdowns at the same time
const fillNavbarChannelDropdown = () => {
  // locate the two dropdown list
  const ulForPublicChannel = document.getElementById("navbar-public-channel-dropdown");
  const ulForPrivateChannel = document.getElementById("navbar-private-channel-dropdown");

  // clear both list
  clearAllChildNodes(ulForPublicChannel);
  clearAllChildNodes(ulForPrivateChannel);

  // prepare fetch
  const token = sessionStorage.getItem('token');

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  fetch(URL_CHANNEL, options)
    .then((response) => {
      if (!response.ok) {
        // the token issue
        createForceLogoutModal();
      }
      else {
        return response.json();
      }
    })
    .then((data) => {
      // add channels into the navbar dropdown list.
      // the channel has many key, 
      // here only focus on: name, private, id,
      // note that "private" is the js keyword,
      // so here I did not use the deconstruct in es6
      const channels = data.channels;
      const userId = parseInt(sessionStorage.getItem("userId"));

      for (const channel of channels) {
        // if the user is not joined in the channel, do not show on the navlist
        if (!IsUserInThisChannel(channel.members, userId)) {
          continue;
        }

        const li = createElement({
          tag: 'li',
        });

        const link = createElement({
          tag: 'a',
          classes: ['dropdown-item'],
          href: '#',
          textContent: channel.name,
          onclick: (e) => {
            e.preventDefault();
            renderThisChannel(channel.id);
          },
        });

        if (channel.private) {
          ulForPrivateChannel.appendChild(li);
        }
        else {
          ulForPublicChannel.appendChild(li);
        }

        li.appendChild(link);
      }

      // if one dropdown list has nothing, display a link to create channel
      if ((!ulForPrivateChannel.firstChild) || (!ulForPublicChannel.firstChild)) {
        // prepare a link 
        const liEmpty = createElement({
          tag: 'li',
        });

        const linkEmpty = createElement({
          tag: 'a',
          href: '#',
          onclick: (e) => e.preventDefault(),
          classes: ['dropdown-item', 'disabled'], 
          textContent: '(Empty)',
        });

        liEmpty.appendChild(linkEmpty);

        // now check if the dropdown menu needs the empty section
        if (!ulForPrivateChannel.firstChild) {
          ulForPrivateChannel.appendChild(liEmpty.cloneNode(true));
        }

        if (!ulForPublicChannel.firstChild) {
          ulForPublicChannel.appendChild(liEmpty.cloneNode(true));
        }
      }
    })
    .catch((err) => {
      console.log(err);
    })
  ;
};


// it is guaranteed that, 
// when this function is called, the channel must be a public channel,
// and the user himself has not joined this channel
const joinNewChannel = (channelId) => {
  const token = sessionStorage.getItem("token");

  const callback = () => {
    // fetch to join the channel
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const url = URL_JOIN_CHANNEL(channelId);

    fetch(url, options)
      .then((response) => {
        if (response.status == 403) {
          createForceLogoutModal();
        }
        else if (response.ok) {
          createModal({
            title: 'Join Channel Success',
            content: 'You have successfully joined this channel !',
            btnArray: [{
              textContent: 'OK',
              isCloseModal: true,
              callback: () => {
                renderThisChannel(channelId);
              }
            }]
          });
        }
        else {
          console.log(`join channel error: ${response.status}`);
        }
      })
    ;
  }

  createModal({
    title: 'Join Channel Confirmation',
    content: 'Are you sure to join this channel ?',
    btnArray: [
      {
        textContent: 'Yes',
        isCloseModal: true,
        callback: callback,
      },
      {
        textContent: 'No',
        isCloseModal: true,
      },
    ]
  })
}


// leave a joined channel.
// assume that the user is definitely in the channel right now.
const leaveChannel = (channelId) => {
  // callback when the user click yes on the modal window
  const callback = () => {
    const url = URL_LEAVE_CHANNEL(channelId);

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
          // the user may be originally in the single channel screen,
          // or the user may be on the home page with the channel list.
          // in both cases, re-render the whole page.
          renderAfterAuth();

          // tell the user
          createSimpleModal({
            title: 'Leave Channel Success',
            content: "You have successfully left this channel.",
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

  createModal({
    title: "Leave Channel Confirmation",
    content: "Are you sure to leave this channel?",
    btnArray: [
      {
        textContent: 'Yes',
        isCloseModal: true,
        callback: callback,
      },
      {
        textContent: 'No',
        isCloseModal: true,
      }
    ],
  });
}


// this fetch is exactly same as we fetch the navbar channels.
// but here I separate them, as they belong to different tasks. 
const fillHomePageChannels = () => {
  // locate 
  const publicChannelList = document.getElementById("home-page-public-channel-list");
  const privateChannelList = document.getElementById("home-page-private-channel-list");

  // clean
  clearAllChildNodes(publicChannelList);
  clearAllChildNodes(privateChannelList);

  // prepare fetch
  const token = sessionStorage.getItem('token');

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };


  fetch(URL_CHANNEL, options)
    .then((response) => {
      if (!response.ok) {
        // the token issue
        createForceLogoutModal();
      }
      else {
        return response.json();
      }
    })
    .then((data) => {
      const channels = data.channels;

      // there are many info with the channel.
      // creator: integer (userid), 
      // id: integer (channel id)
      // members: [integer(user id)],
      // name: string,
      // private: boolean

      // the user can see all public channels.
      // if he is not in this public channel, show a button: Join.
      // however, for private channel, he can only see all the private channels he has joined already.

      const userId = parseInt(sessionStorage.getItem('userId'));

      for (const channel of channels) {
        // do not display private channel & that the user has not join
        if (channel.private && (!IsUserInThisChannel(channel.members, userId))) {
          continue;
        }

        // now remain: all public channel, and private channels he has joined already
        const card = createElement({
          tag: 'div',
          classes: [
            'card', 'h-100',
            'col-xs-5', 'col-sm-5', 'col-md-5', 'col-lg-4', 'col-xl-3', 'col-xxl-3', 
            'me-3', 'mb-3',
          ],
        });

        const cardBody = createElement({
          tag: 'div',
          classes: ['card-body'],
        });

        const name = createElement({
          tag: 'h5',
          classes: ['card-title'],
          textContent: channel.name,
        });

        const emptyCardText = createElement({
          tag: 'p',
          classes: ['card-text'],
          textContent: '  ',
        });

        card.appendChild(cardBody);
        appendAllChildNodes(cardBody, [name, emptyCardText]);


        // some buttons.
        // check public channel & that he has not joined, display the join button
        if ((!channel.private) && (!IsUserInThisChannel(channel.members, userId))) {
          const btnJoin = createElement({
            tag: 'a',
            href: '#',
            classes: ['btn', 'btn-outline-primary', 'card-link', 'btn-sm'],
            textContent: 'Join',
            onclick: () => joinNewChannel(channel.id),
          });
  
          cardBody.appendChild(btnJoin);
        }
        else {
          // for joined public channel, or joined private channel,
          // display Enter and Leave two buttons

          const btnEnter = createElement({
            tag: 'a',
            href: '#',
            classes: ['btn', 'btn-outline-primary', 'card-link', 'btn-sm'],
            textContent: 'Enter',
            onclick: () => renderThisChannel(channel.id),
          });
  
          const btnLeave = createElement({
            tag: 'a',
            href: '#',
            classes: ['btn', 'btn-outline-secondary', 'card-link', 'btn-sm'],
            textContent: 'Leave',
            onclick: () => leaveChannel(channel.id),
          });

          appendAllChildNodes(cardBody, [btnEnter, btnLeave]);
        }

        // add to the list
        if (channel.private) {
          privateChannelList.appendChild(card);
        }
        else {
          publicChannelList.appendChild(card);
        }
      }

      // consider if one of the list is empty
      if ((!privateChannelList.firstChild) || (!publicChannelList.firstChild)) {
        const h5 = createElement({
          tag: 'h5',
          textContent: 'There is no channels here. You may create one :)',
        });

        const btnCreate = createElement({
          tag: 'button',
          type: 'button', 
          textContent: 'Create',
          classes: ['btn', 'btn-sm', 'btn-outline-primary', 'ms-3'],
          onclick: () => {
            e.preventDefault();
            renderNewChannelPage();
          },
        });
        
        // the default css for h5 is width 100%, so shrink it. 
        h5.style.width = "fit-content";
        btnCreate.style.width = "fit-content";

        const addClasses = ['d-flex', 'flex-row', 'align-items-center'];

        if (!privateChannelList.firstChild) {
          addClasses.forEach((newClass) => privateChannelList.classList.add(newClass));
          appendAllChildNodes(privateChannelList, [h5.cloneNode(true), btnCreate.cloneNode(true)]);
        }
        else {
          addClasses.forEach((newClass) => publicChannelList.classList.add(newClass));
          appendAllChildNodes(publicChannelList, [h5.cloneNode(true), btnCreate.cloneNode(true)]);
        }
      }
    })
    .catch((err) => {
      console.log(err);
    })
  ;

}


const renderAfterAuth = () => {
  // clean 
  const navbar = document.getElementById("navbar");
  clearAllChildNodes(navbar);

  const main  = document.getElementById("main");
  clearAllChildNodes(main);

  // inside navbar:
  // home button
  // dropdown for public channel, 
  // dropdown for private channel,
  // create channel button
  // my profile button
  // logout button

  // home button
  const liForHome = createElement({
    tag: 'li', 
    classes: ['nav-item', 'ps-2', 'pe-2'],
  });

  const linkForHome = createElement({
    tag: 'a',
    classes: ['nav-link', 'active'],
    href: '#',
    textContent: 'Home',
    onclick: (e) => {
      e.preventDefault();
      renderAfterAuth();
    },
  });

  navbar.appendChild(liForHome);
  liForHome.appendChild(linkForHome);
  
  // public channel dropdown
  const liForPublicChannel = createElement({
    tag: 'li',
    classes: ['nav-item', 'dropdown', 'ps-2', 'pe-2'],
  });
  navbar.appendChild(liForPublicChannel);

  const linkForPublicChannel = createElement({
    tag: 'a',
    classes: ['nav-link', 'dropdown-toggle'],
    href: '#',
    role: 'button', 
    textContent: 'Public Channel',
    'data-bs-toggle': 'dropdown',
  });

  const ulForPublicChannel = createElement({
    tag: 'ul',
    classes: ['dropdown-menu'],
    id: 'navbar-public-channel-dropdown',
  });

  appendAllChildNodes(liForPublicChannel, [linkForPublicChannel, ulForPublicChannel]);


  // private channel dropdown
  const liForPrivateChannel = createElement({
    tag: 'li',
    classes: ['nav-item', 'dropdown', 'ps-2', 'pe-2'],
  });
  navbar.appendChild(liForPrivateChannel);

  const linkForPrivateChannel = createElement({
    tag: 'a',
    classes: ['nav-link', 'dropdown-toggle'],
    href: '#',
    role: 'button', 
    textContent: 'Private Channel',
    'data-bs-toggle': 'dropdown',
  });

  const ulForPrivateChannel = createElement({
    tag: 'ul',
    classes: ['dropdown-menu'],
    id: 'navbar-private-channel-dropdown',
  });

  appendAllChildNodes(liForPrivateChannel, [linkForPrivateChannel, ulForPrivateChannel]);

  // now fetch the backend to fill both the public and private channel.
  // the two dropdown has id attribute to locate
  fillNavbarChannelDropdown();


  // create channel button
  const liForNewChannel = createElement({
    tag: 'li',
    classes: ['nav-item', 'active', 'ps-2', 'pe-2'],
  });

  const linkForNewChannel = createElement({
    tag: 'a',
    href: '#',
    classes: ['nav-link'],
    textContent: 'New Channel',
    onclick: (e) => {
      e.preventDefault();
      renderNewChannelPage();
    },
  });

  navbar.appendChild(liForNewChannel);
  liForNewChannel.appendChild(linkForNewChannel);

  // my profile button
  const liForMyProfile = createElement({
    tag: 'li',
    classes: ['nav-item', 'active', 'ps-2', 'pe-2'],
  });

  const linkForMyProfile = createElement({
    tag: 'a',
    href: '#',
    classes: ['nav-link'],
    textContent: 'My Profile',
    onclick: (e) => {
      e.preventDefault();
      viewMyProfile();
    },
  });

  navbar.appendChild(liForMyProfile);
  liForMyProfile.appendChild(linkForMyProfile);

  // and a log out button
  // the button should be added outside the navbar, so that it will locate at far right
  // check if has that button, if not, add this button
  if (document.getElementById("linkLogout") === null) {
    const linkLogout = createElement({
      id: 'linkLogout',
      tag: 'a',
      href: '#',
      classes: ['nav-link', 'link-secondary', 'ms-0', 'ps-2'],
      textContent: 'Logout',
      onclick: (e) => {
        e.preventDefault();
        
        createModal({
          title: 'Logout Confirmation',
          content: 'Are you sure to log out?',
          btnArray: [
            {
              textContent: 'Yes',
              isCloseModal: true,
              callback: () => {
                sessionStorage.clear();
                checkAuthStatus();
  
                // also remove the button itself
                linkLogout.parentNode.removeChild(linkLogout);
              }
            },
            {
              textContent: 'No',
              isCloseModal: true,
            }
          ]
        });
      },
    });

    navbar.parentNode.appendChild(linkLogout);
  }


  // now consider the main body.
  // the home page should list all the channels in card format.
  // the card shows the channel name, (not the id), public/private setting, 
  // and all users' avatar, when hover can view the user's profile.
  // all these put into the "main"

  // top flex-container: row
  const row = createElement({
    tag: 'div',
    classes: ['row', 'ps-3', 'pe-3'],
  });

  main.appendChild(row);

  // each channel list has a col-12 container
  const publicChannelWrapper = createElement({
    tag: 'div',
    classes: ['col-12', 'mb-4'],
  })

  const privateChannelWrapper = publicChannelWrapper.cloneNode(true);
  appendAllChildNodes(row, [publicChannelWrapper, privateChannelWrapper]);

  // inside each channel, there is a title
  const publicChannelTitle = createElement({
    tag: 'h3',
    textContent: 'Public Channels',
  });

  const privateChannelTitle = createElement({
    tag: 'h3',
    textContent: 'Private Channels',
  });

  // and also inside each channel, there is a div class=row for all the possible channels
  const publicChannelList = createElement({
    tag: 'div',
    classes: ['container', 'p-3', 'row'],
    id: 'home-page-public-channel-list',
  });

  const privateChannelList = publicChannelList.cloneNode(true);
  privateChannelList.id = 'home-page-private-channel-list';

  // link dom
  appendAllChildNodes(publicChannelWrapper, [publicChannelTitle, publicChannelList]);
  appendAllChildNodes(privateChannelWrapper, [privateChannelTitle, privateChannelList]);

  // fill them, they both have id to locate
  fillHomePageChannels();
};


export { renderAfterAuth, fillNavbarChannelDropdown, leaveChannel };


