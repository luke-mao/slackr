'use strict'

import { URL_LOGIN, URL_REGISTER } from './url.js';
import { appendAllChildNodes, clearAllChildNodes, createElement } from './util.js';
import { renderAfterAuth } from './home.js';
import { createModal, createSimpleModal } from './modal.js';
import { REGEX_EMAIL, REGEX_TEXT } from './regex.js';


const checkAuthStatus = () => {
  if (sessionStorage.getItem('token')) {
    // has token, check the status
    console.log('has token');
    renderAfterAuth();
  }
  else {
    renderLoginPage();
  }
};


const createNavBarButton = (name) => {
  // the outside is a <li> tag
  const li = createElement({
    tag: 'li',
    classes: ['nav-item', 'ps-2', 'pe-2'],
  });

  // the inner is <a> tag
  const link = createElement({
    tag: 'a',
    classes: ['nav-link', 'active'],
    textContent: name,
    href: '#',
  });

  // append
  li.appendChild(link);
  return li;
}


const renderLoginForm = () => {
  // get the main container
  const main = document.getElementById('main');
  clearAllChildNodes(main);

  // show a picture on the left, and the form on the right
  // the picture disappears for small screen

  // a grid row container
  const row = createElement({
    tag: 'div',
    classes: ['row', 'justify-content-around'],
  });

  main.appendChild(row);

  // left picture
  const imgContainer = createElement({
    tag: 'div',
    classes: ['col-md-5', 'text-center', 'd-none', 'd-md-block'],
  })

  const img = createElement({
    tag: 'img',
    classes: ['img-fluid'],
    src: './styles/img/login_register.png',
    alt: 'login and signup image'
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
    textContent: 'Login Form',
  });

  form.appendChild(header);

  // email field
  const divEmail = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelEmail = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'login form email input',
    textContent: 'Email',
  });

  const inputEmail = createElement({
    tag: 'input',
    type: 'email',
    classes: ['form-control'],
    placeholder: 'xxx@mail.com',
    required: 'required',
  });

  form.appendChild(divEmail);
  appendAllChildNodes(divEmail, [labelEmail, inputEmail]);

  // password field
  const divPassword = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelPassword = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'login form password input',
    textContent: 'Password',
  });

  const inputPassword = createElement({
    tag: 'input',
    type: 'password',
    classes: ['form-control'],
    placeholder: '******',
    required: 'required',
  });

  form.appendChild(divPassword);
  appendAllChildNodes(divPassword, [labelPassword, inputPassword]);

  // submit button
  const divBtnSubmit = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8', 'text-center'],
  });

  const btnSubmit = createElement({
    tag: 'button',
    type: 'button',
    textContent: 'Submit',
    classes: ['btn', 'btn-primary', 'ps-5', 'pe-5'],
  })

  form.appendChild(divBtnSubmit);
  divBtnSubmit.appendChild(btnSubmit);

  // button click
  btnSubmit.onclick = (e) => {
    e.preventDefault();

    const email = inputEmail.value;
    const password = inputPassword.value;

    // check the two inputs if are empty
    if (email.length == 0 || password.length == 0) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please input all fields before submission.',
        btnText: 'OK',
      })

      return;
    }

    // now two inputs are not empty
    // for the email, match the regex before submission
    // allow: a-z A-Z 0-9 _ - and @
    const regexEmail = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    if (!email.match(regexEmail)) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please enter a valid email before submission',
        btnText: 'OK',
      })
      return;
    }

    // the password is at least 6 characters
    if (password.length < 6) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'The password should be at least 6 characters',
        btnText: 'OK',
      })

      return;
    }

    // now submit
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({email, password}),
    };

    fetch(URL_LOGIN, options)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        else {
          // login fail
          createSimpleModal({
            title: 'Login Fail',
            content: 'Please double check your email and password.',
            btnText: 'OK',
          });
        }
      })
      .then((data) => {
        // login successful, save the token and user id
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userId', data.userId);

        // tell the user
        createModal({
          title: 'Login Success',
          content: 'Welcome back to Slackr !!!',
          btnArray: [{
            textContent: 'OK',
            isCloseModal: true,
            callback: () => renderAfterAuth(),
          }]
        });
      })
    ;
  };
};


const renderSignupForm = () => {
  // similar layout with the login form
  // get the main container
  const main = document.getElementById('main');
  clearAllChildNodes(main);

  // show a picture on the left, and the form on the right
  // the picture disappears for small screen

  // a grid row container
  const row = createElement({
    tag: 'div',
    classes: ['row', 'justify-content-center'],
  });

  main.appendChild(row);

  // left picture
  const imgContainer = createElement({
    tag: 'div',
    classes: ['col-md-5', 'text-center', 'd-none', 'd-md-block'],
  })

  const img = createElement({
    tag: 'img',
    classes: ['img-fluid'],
    src: './styles/img/login_register.png',
    alt: 'login and signup image'
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
    textContent: 'Signup Form',
  });

  form.appendChild(header);

  // four fields: email, name, password, confirm password

  // email field
  const divEmail = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelEmail = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'sign up form email input',
    textContent: 'Email',
  });

  const inputEmail = createElement({
    tag: 'input',
    type: 'email',
    classes: ['form-control'],
    placeholder: 'xxx@mail.com',
    required: 'required',
  });

  form.appendChild(divEmail);
  appendAllChildNodes(divEmail, [labelEmail, inputEmail]);


  // name field
  const divName = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelName = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'sign up form name input',
    textContent: 'Name',
  });

  const inputName = createElement({
    tag: 'input',
    type: 'text',
    classes: ['form-control'],
    placeholder: 'your name',
    required: 'required',
  });

  form.appendChild(divName);
  appendAllChildNodes(divName, [labelName, inputName]);


  // password field
  const divPassword = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelPassword = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'sign up form password input',
    textContent: 'Password',
  });

  const inputPassword = createElement({
    tag: 'input',
    type: 'password',
    classes: ['form-control'],
    placeholder: '******',
    required: 'required',
  });

  form.appendChild(divPassword);
  appendAllChildNodes(divPassword, [labelPassword, inputPassword]);


  // confirm password
  const divPassword2 = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8'],
  });

  const labelPassword2 = createElement({
    tag: 'label',
    classes: ['form-label', 'text-start'],
    for: 'sign up form confirm password input',
    textContent: 'Confirm Password',
  });

  const inputPassword2 = createElement({
    tag: 'input',
    type: 'password',
    classes: ['form-control'],
    placeholder: '******',
    required: 'required',
  });

  form.appendChild(divPassword2);
  appendAllChildNodes(divPassword2, [labelPassword2, inputPassword2]);


  // submit button
  const divBtnSubmit = createElement({
    tag: 'div',
    classes: ['mb-4', 'col-xs-10', 'col-md-8', 'text-center'],
  });

  const btnSubmit = createElement({
    tag: 'button',
    type: 'button',
    textContent: 'Submit',
    classes: ['btn', 'btn-primary', 'ps-5', 'pe-5'],
  })

  form.appendChild(divBtnSubmit);
  divBtnSubmit.appendChild(btnSubmit);

  // button click
  btnSubmit.onclick = (e) => {
    e.preventDefault();

    const email = inputEmail.value;
    const name = inputName.value;
    const password = inputPassword.value;
    const password2 = inputPassword2.value;

    // check the two inputs if are empty
    if (email.length === 0 || name.length === 0 || password.length === 0 || password2.length === 0) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please input all fields before submission.',
        btnText: 'OK',
      });

      return;
    }

    // now all inputs are not empty
    // for the email, match the regex before submission
    // allow: a-z A-Z 0-9 _ - and @
    if (!email.match(REGEX_EMAIL)) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please enter a valid email before submission',
        btnText: 'OK',
      });

      return;
    }


    // no rule on name, so ensure name is not a single character
    if (!name.match(REGEX_TEXT)) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'Please enter a valid name before submission. A valid name may include at least two letters.',
        btnText: 'OK',
      });

      return;
    }


    // the password is at least 6 characters
    if (password.length < 6) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'The password should be at least 6 characters',
        btnText: 'OK',
      });

      return;
    }

    // password2 must be the same as password
    if (password2 !== password) {
      createSimpleModal({
        title: 'Submission Error',
        content: 'The two passwords must match.',
        btnText: 'OK',
      });
      
      return;
    }

    // now submit
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({email, password, name}),
    };

    fetch(URL_REGISTER, options)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        else {
          // register fail
          createSimpleModal({
            title: 'Registration Fail',
            content: 'Sorry. Something went wrong. Please try again later..',
            btnText: 'OK',
          });

          createSimpleModal
        }
      })
      .then((data) => {
        console.log(data);  

        // login successful, save the token and user id
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userId', data.userId);

        // tell the user
        createModal({
          title: 'Registeration Success',
          content: 'Welcome to Slackr !!!',
          btnArray: [{
            textContent: 'OK',
            isCloseModal: true,
            callback: () => renderAfterAuth(),
          }]
        });
      })
    ;
  };
}


const renderLoginPage = () => {
  // clear the navbar
  const navbar = document.getElementById('navbar');
  clearAllChildNodes(navbar);

  // add 2 buttons: Log In, Sign Up
  const btnLogin = createNavBarButton("Login");
  const btnSignup = createNavBarButton("Sign Up");

  // append to navbar
  appendAllChildNodes(navbar, [btnLogin, btnSignup]);

  // for the login and signup, once click, show the form
  btnLogin.onclick = (e) => {
    e.preventDefault();
    renderLoginForm();
  };

  btnSignup.onclick = (e) => {
    e.preventDefault();
    renderSignupForm();
  };

  // show the login form on default
  btnLogin.click();
}


export {checkAuthStatus};
