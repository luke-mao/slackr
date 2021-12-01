'use strict'

import { fileToDataUrl } from "./helpers.js";
import {  } from "./home.js";
import { createForceLogoutModal, createSimpleModal, createUserProfileModal } from "./modal.js";
import { REGEX_EMAIL, REGEX_SPACE, REGEX_TEXT } from "./regex.js";
import { URL_SPECIFIC_USER, URL_UPDATE_PROFILE } from "./url.js";
import { appendAllChildNodes, clearAllChildNodes, createElement } from "./util.js";

// two main functions in this file: 
// 1. user click to see others' profile in a popup modal
// 2. the user view own profile on a separate page.


const viewOtherUserProfile = (userId) => {
  const url = URL_SPECIFIC_USER(userId);

  const token = sessionStorage.getItem('token');
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  }

  fetch(url, options)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      else if (response.status == 403) {
        createForceLogoutModal();
      }
      else {
        throw response.status;
      }
    })
    .then((data) => {
      createUserProfileModal(data);
    })
    .catch((err) => {
      console.log(err);
    })
  ;
}


// the format is similar to the viewOtherProfile.
// only difference is that, the avatar image is on the left.
// and the username, email, bio is on the right.
// add a little shade so that it looks like a page out of the screen.
// and for the small screen, avatar image at the top, and content at bottom,
// so looks similar with viewOtherUserProfile
const viewMyProfile = () => {
  // initialize
  const main = document.getElementById("main");
  clearAllChildNodes(main);

  // grid, and the mainContent sits in the center
  const row = createElement({
    tag: 'div',
    classes: ['row', 'justify-content-center', 'pt-5'],
  });

  const mainContent = createElement({
    tag: 'div',
    classes: [
      'col-xs-10', 'col-sm-10', 'col-md-9', 'col-lg-9', 'col-xl-8', 'col-xxl-8',
      'row', 'justify-content-center',
      'shadow', 'rounded',
      'pt-5', 'pt-xs-4', 'pt-sm-4',
      'pb-5', 'pb-xs-4', 'pb-sm-4',
    ]
  })

  main.appendChild(row);
  row.appendChild(mainContent);


  // left column. when screen <= sm, add a padding bottom
  const columnLeft = createElement({
    tag: 'div',
    classes: [
      'col-xs-10', 'col-sm-9', 'col-md-6', 
      'text-center',
      'd-flex', 'justify-content-center', 'align-items-center',
      'pb-3', 'pt-3',
    ],
  })

  const image = createElement({
    tag: 'img',
    width: '220',
    height: '220',
    src: '../styles/img/default_avatar.png',
    alt: 'user profile avatar image'
  });

  // right column
  const columnRight = createElement({
    tag: 'div',
    classes: [
      'col-xs-10', 'col-sm-9', 'col-md-6',
      'd-flex', 'flex-column', 'justify-content-center', 'align-items-center',
    ],
  });


  // the name has the section name, but also a button to edit the profile
  const divName = createElement({
    tag: 'div',
    classes: ['d-flex', 'flex-row', 'justify-content-center', 'align-items-center', 'pb-3', 'text-center'],
  });

  const divNameContent = createElement({
    tag: 'div',
    classes: ['fs-3', 'fw-bold', 'font-monospace'],
    textContent: 'My name'
  });

  // next to the name, there is a icon button to edit
  const btnEdit = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-sm', 'ms-2'],
    'data-bs-toggle': 'tooltip',
    'data-bs-placement': 'top',
    'title': 'Edit Channel',
  });

  const iconEdit = createElement({
    tag: 'img',
    src: '../styles/img/pencil.svg',
    width: '21',
    height: '21',
  });

  // the tooltip may always stay on the page, so need to manually hide it
  const tooltip = new bootstrap.Tooltip(btnEdit);


  // then is the line of bio
  const divBio = createElement({
    tag: 'div',
    classes: ['fs-6', 'text-muted', 'font-monospace', 'pb-3', 'text-center'],
    textContent: 'Bio',
  });

  const divEmail = divBio.cloneNode(false);
  divEmail.textContent = 'Email';

  // DOM join
  appendAllChildNodes(mainContent, [columnLeft, columnRight]);
  columnLeft.appendChild(image);
  appendAllChildNodes(columnRight, [divName, divBio, divEmail]);
  appendAllChildNodes(divName, [divNameContent, btnEdit]);
  btnEdit.appendChild(iconEdit);

  // click on the edit button
  btnEdit.onclick = (e) => {
    e.preventDefault();
    tooltip.hide();
    editMyProfile();
  };


  // fetch the my profile
  const userId = sessionStorage.getItem("userId");
  const token = sessionStorage.getItem("token");
  
  const url = URL_SPECIFIC_USER(userId);
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
      // definitely has name and email.
      // but may not have avatar image or bio.
      divNameContent.textContent = data.name;
      divEmail.textContent = data.email;
      divBio.textContent = data.bio ? data.bio : "You didn't provide a biography yet.";
      if (data.image) image.src = data.image;
    })
    .catch((err) => {
      console.log(err);
    })
  ;
}


// similar format as the create new channel page.
const editMyProfile = () => {
  // get the "main"
  const main = document.getElementById("main");
  clearAllChildNodes(main);


  // a grid row container contains two columns
  const row = createElement({
    tag: 'div',
    classes: ['row', 'justify-content-around', 'pt-5'],
  });

  const columnLeft = createElement({
    tag: 'div',
    classes: [
      'col-xs-9', 'col-sm-8', 'col-md-5', 'pb-4',
      'd-flex', 'flex-column', 'justify-content-center', 'align-items-center',
    ],
  })

  const columnRight = createElement({
    tag: 'div',
    classes: ['col-10','col-md-5'],   
  })
  
  main.appendChild(row);
  appendAllChildNodes(row, [columnLeft, columnRight]);

  
  // left column holds the picture
  const img = createElement({
    tag: 'img',
    width: '220',
    height: '220',
    src: '../styles/img/default_avatar.png',
    alt: 'new channel cartoon image'
  });

  const btnUploadNewImg = createElement({
    tag: 'input',
    type: 'file',
    classes: ['mt-4', 'form-control', 'form-control-sm'],
    textContent: 'Upload New Avatar',
  });

  btnUploadNewImg.style.width = "210px";

  appendAllChildNodes(columnLeft, [img, btnUploadNewImg]);


  // right column contains the form
  const form = createElement({
    tag: 'form',
    classes: ['row'],
  });
  
  columnRight.appendChild(form);

  // header 
  const header = createElement({
    tag: 'h3',
    classes: ['text-center', 'mb-4', 'col-xs-10', 'col-md-8'],
    textContent: 'Edit Profile',
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
    for: 'username',
    textContent: 'Username',
  });

  const inputName = createElement({
    tag: 'input',
    type: 'text',
    classes: ['form-control'],
    placeholder: 'Username',
    required: 'required',
  });

  form.appendChild(divName);
  appendAllChildNodes(divName, [labelName, inputName]);


  // email field
  const divEmail = divName.cloneNode(false);
  const labelEmail = labelName.cloneNode(false);
  const inputEmail = inputName.cloneNode(false);

  labelEmail.for = 'Email';
  labelEmail.textContent = 'Email';
  inputEmail.placeholder = 'Email';
  
  form.appendChild(divEmail);
  appendAllChildNodes(divEmail, [labelEmail, inputEmail]);

  // biography field
  const divBio = divName.cloneNode(false);
  const labelBio = labelName.cloneNode(false);
  const inputBio = inputName.cloneNode(false);

  labelBio.for = 'Biography';
  labelBio.textContent = 'Biography';
  inputBio.placeholder = 'Biography';
  
  form.appendChild(divBio);
  appendAllChildNodes(divBio, [labelBio, inputBio]);

  // password field
  const divPwd1 = divName.cloneNode(false);
  const labelPwd1 = labelName.cloneNode(false);
  
  const btnToggle1 = createElement({
    tag: 'button',
    type: 'button',
    classes: ['btn', 'btn-sm', 'ms-2', 'mb-1'],
  });

  const iconToggle1 = createElement({
    tag: 'img',
    src: '../styles/img/eye-slash.svg',
    width: '20',
    height: '20'
  });

  const inputPwd1 = inputName.cloneNode(false);

  labelPwd1.for = "Password";
  labelPwd1.textContent = 'New Password';
  inputPwd1.placeholder = '******';
  inputPwd1.type = 'Password';

  form.appendChild(divPwd1);
  appendAllChildNodes(divPwd1, [labelPwd1, btnToggle1, inputPwd1]);
  btnToggle1.appendChild(iconToggle1);

  // confirm password field
  const divPwd2 = divPwd1.cloneNode(false);
  const labelPwd2 = labelPwd1.cloneNode(false);
  const btnToggle2 = btnToggle1.cloneNode(false);
  const iconToggle2 = iconToggle1.cloneNode(false);
  const inputPwd2 = inputPwd1.cloneNode(false);

  labelPwd2.textContent = 'Confirm New Password';

  form.appendChild(divPwd2);
  appendAllChildNodes(divPwd2, [labelPwd2, btnToggle2, inputPwd2]);
  btnToggle2.appendChild(iconToggle2);

  // set up the toggle action
  const setUpToggle = (btn, icon, input) => {
    // the on mouse over will make the screen fluatuate, 
    // so only use onclick function.
    
    // btn.onmouseover = () => {
    //   icon.src = "../styles/img/eye.svg";
    //   input.type = "text";
    // };

    // btn.onmouseout = () => {
    //   icon.src = "../styles/img/eye-slash.svg";
    //   input.type = "password";
    // };

    btn.onclick = () => {
      if (input.type === "text") {
        icon.src = "../styles/img/eye-slash.svg";
        input.type = "password";
      }
      else {
        icon.src = "../styles/img/eye.svg";
        input.type = "text";
      }
    }
  };

  setUpToggle(btnToggle1, iconToggle1, inputPwd1);
  setUpToggle(btnToggle2, iconToggle2, inputPwd2);


  // submit button
  const divBtns = createElement({
    tag: 'div',
    classes: [
      'mt-1', 'mb-4', 'col-xs-10', 'col-md-8',
      'd-flex', 'flex-row', 'justify-content-center',
    ],
  });

  const btnCancel = createElement({
    tag: 'button', 
    type: 'button',
    textContent: 'Cancel',
    classes: ['btn', 'btn-secondary', 'me-4'],
  })

  const btnReset = btnCancel.cloneNode(false);
  btnReset.textContent = 'Reset';

  const btnSubmit = createElement({
    tag: 'button',
    type: 'button',
    textContent: 'Submit',
    classes: ['btn', 'btn-primary'],
  })

  form.appendChild(divBtns);
  appendAllChildNodes(divBtns, [btnCancel, btnReset, btnSubmit]);

  
  // fetch my current profile.
  // store the {name, bio, img, email} in DOM element attribute, as old-{xxx}: value.
  // so during the submit function, we can compare them with the new value.
  const userId = sessionStorage.getItem("userId");
  const token = sessionStorage.getItem("token");
  
  const urlForMyProfile = URL_SPECIFIC_USER(userId);
  const optionsForMyProfile = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  fetch(urlForMyProfile, optionsForMyProfile)
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
      // name
      inputName.value = data.name;
      inputName.setAttribute("old-name", data.name);

      // email
      inputEmail.value = data.email;
      inputEmail.setAttribute("old-email", data.email);

      // bio, may not have the value
      if (data.bio) {
        inputBio.value = data.bio;
        inputBio.setAttribute("old-bio", data.bio);
      }

      // image, may not have this value before
      if (data.image) {
        img.src = data.image;
        img.setAttribute("old-img", data.img);
      }
    })
    .catch((err) => {
      console.log(err);
    })
  ;


  // onclick event
  // upload photo
  btnUploadNewImg.onchange = () => {
    // check file type
    const file = btnUploadNewImg.files[0];
    
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ];
    const isValid = validFileTypes.find(type => type == file.type);

    if (!isValid) {
      createSimpleModal({
        title: 'Upload Avatar Error',
        content: 'Sorry. We only support jpeg, png, and jpg files at this moment..',
        btnText: 'OK',
      });

      btnUploadNewImg.value = "";
      return;
    }

    // use the provided function to decode file into base64 format
    fileToDataUrl(file)
      .then((base64String) => {
        img.src = base64String;
        img.setAttribute("has-changed", "true");
      })
      .catch((err) => {
        console.log(err);

        btnUploadNewImg.value = "";
        createSimpleModal({
          title: 'Upload Avatar Error',
          content: 'Sorry, something went wrong. Please upload again..',
          btnText: 'OK',
        });
      })
    ;
  }


  // btnCancel: go back to the profile
  btnCancel.onclick = (e) => {
    e.preventDefault();
    viewMyProfile();
  };

  // btnReset: reset the all inputs
  btnReset.onclick = (e) => {
    e.preventDefault();

    // so the inputName and inputEmail definitely has the previous value
    inputName.value = inputName.getAttribute("old-name");
    inputEmail.value = inputEmail.getAttribute("old-email");

    // inputBio may have previous value
    if (inputBio.hasAttribute("old-bio")) {
      inputBio.textContent = inputBio.getAttribute("old-bio");
    }
    else {
      inputBio.textContent = "";
    }

    // img may have previous value
    if (img.hasAttribute("old-img")) {
      img.src = img.getAttribute("old-img");
    }
    else {
      img.src = "../styles/img/default_avatar.png";
    }

    // clear password field
    inputPwd1.value = "";
    inputPwd2.value = "";
  };

  
  // submit 
  btnSubmit.onclick = (e) => {
    e.preventDefault();

    // obtain new value
    const newName = inputName.value;
    const newEmail = inputEmail.value;
    const newBio = inputBio.value;
    const newPwd1 = inputPwd1.value;
    const newPwd2 = inputPwd2.value;
    const newImg = img.src;

    // sanity check
    if (!newName.match(REGEX_TEXT)) {
      createSimpleModal({
        title: 'Edit Profile Error',
        content: 'Please input a valid username. A username should have at least two letters.',
        btnText: 'OK',
      });

      return;
    }

    if (!newEmail.match(REGEX_EMAIL)) {
      createSimpleModal({
        title: 'Edit Profile Error',
        content: 'Please input a valid email address.',
        btnText: 'OK',
      });

      return;
    }

    // no need to check the bio. but it cannot be all empty spaces
    if (newBio.length > 0 && newBio.match(REGEX_SPACE)) {
      createSimpleModal({
        title: 'Edit Profile Error',
        content: 'Please input a valid biography.',
        btnText: 'OK',
      });

      return;
    }

    // but if pwd is not empty, then it needs to be check
    if ((newPwd1.length > 0 || newPwd2.length > 0) && (newPwd1.length != newPwd2.length)) {
      createSimpleModal({
        title: 'Edit Profile Error',
        content: 'If you would like to update the password, please fill both password fields the same password.',
        btnText: 'OK',
      });

      return;
    }

    if (newPwd1.length > 0 && newPwd1.length < 6) {
      createSimpleModal({
        title: 'Edit Profile Error',
        content: 'The password should contain at least 6 characters.',
        btnText: 'OK',
      });

      return;
    }
   

    // ready to submit, prepare the data
    const newData = {};

    if (newName != inputName.getAttribute("old-name")) newData.name = newName;
    if (newEmail != inputEmail.getAttribute("old-email")) newData.email = newEmail;

    if (inputBio.hasAttribute("old-bio") && newBio !== inputBio.getAttribute("old-bio")) newData.bio = newBio;
    if (!inputBio.hasAttribute("old-bio") && newBio.length > 0) newData.bio = newBio;
    
    if (newPwd1.length > 0) newData.password = newPwd1;
    if (img.getAttribute("has-changed") === "true") newData.image = newImg;

    // check if nothing change
    if (Object.keys(newData).length == 0) {
      createSimpleModal({
        title: 'Edit Profile Error',
        content: 'Please update your profile before submission.',
        btnText: 'OK',
      });

      return;
    }

    console.log(newData);
    // ready for submit
    const urlUpdateProfile = URL_UPDATE_PROFILE;
    const optionsUpdateProfile = {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newData),
    };

    fetch(urlUpdateProfile, optionsUpdateProfile)
      .then((response) => {
        if (response.ok) {
          // refresh to the profile page
          viewMyProfile();
          
          // tell the user
          createSimpleModal({
            title: 'Update Profile Successful',
            content: 'You have successfully updated your profile.',
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
};


export { viewOtherUserProfile, viewMyProfile };

